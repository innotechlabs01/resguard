import { clerkAuthMiddleware } from '@lib/auth/clerk-utils'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export function secureApiHandler(
  handler: (request: Request, user: any) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      const ip = request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        request.headers.get('x-forwarded') ||
        'unknown'

      const { success, remaining } = await checkRateLimit(ip)
      if (!success) {
        logger.warn({ ip, path: request.url }, 'Rate limit exceeded')
        return new NextResponse(
          JSON.stringify({ error: 'Rate limit exceeded', details: 'Too many requests, please try again later.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '900' } }
        )
      }

      const authResult = await clerkAuthMiddleware(request)

      if (!authResult.isAuthenticated) {
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized', details: authResult.error }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      return await handler(request, authResult.user)
    } catch (error: any) {
      logger.error({ error: error?.message, stack: error?.stack }, 'API security error')
      return new NextResponse(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }
}

export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('X-Content-Type-Options', 'nosniff')
  headers.set('X-Frame-Options', 'DENY')
  headers.set('X-XSS-Protection', '1; mode=block')
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
