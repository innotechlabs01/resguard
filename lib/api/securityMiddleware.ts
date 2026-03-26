import { clerkAuthMiddleware } from '@lib/auth/clerk-utils'
import { NextResponse } from 'next/server'

// Simple in-memory rate limiter
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

function getRateLimitKey(ip: string): string {
  return `rate_limit:${ip}`;
}

function isRateLimited(ip: string): { isLimited: boolean; resetTime: number } {
  const key = getRateLimitKey(ip);
  const entry = rateLimitStore.get(key);
  
  const now = Date.now();
  
  // Clean expired entries
  if (entry && entry.resetTime < now) {
    rateLimitStore.delete(key);
    return { isLimited: false, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return { isLimited: false, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { isLimited: true, resetTime: entry.resetTime };
  }
  
  entry.count++;
  return { isLimited: false, resetTime: entry.resetTime };
}

export function secureApiHandler(
  handler: (request: Request, user: any) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      // Rate limiting
      const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('x-forwarded') || 
               request.headers.get('x-cluster-client-ip') || 
               request.headers.get('forwarded-for') || 
               request.headers.get('forwarded') || 
               'unknown';
    
      const rateLimitResult = isRateLimited(ip);
      if (rateLimitResult.isLimited) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Rate limit exceeded', 
            details: 'Too many requests, please try again later.' 
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }
    
      // Authentication
      const authResult = await clerkAuthMiddleware(request);
    
      if (!authResult.isAuthenticated) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized', details: authResult.error }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
            }
          }
        )
      }
    
      // If authenticated, proceed with handler
      return await handler(request, authResult.user);
    } catch (error: any) {
      console.error('API security error:', error);
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  };
}

// Helper to add security headers
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Content-Security-Policy', "default-src 'self'");
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}