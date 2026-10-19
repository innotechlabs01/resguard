import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'rate-limit' })

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

let ratelimit: Ratelimit | null = null

function getRateLimiter(): Ratelimit | null {
  if (!redisUrl || !redisToken) return null
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(100, '15 m'),
      analytics: true,
    })
  }
  return ratelimit
}

/**
 * M3 fix: rate limit now fails CLOSED in production when Upstash is not
 * configured. In non-production (dev/QA), it still fails open so the
 * app is testable without Redis.
 */
export async function checkRateLimit(
  identifier: string,
  opts?: { failOpen?: boolean }
): Promise<{ success: boolean; remaining: number }> {
  const limiter = getRateLimiter()
  if (!limiter) {
    const isProduction = process.env.APP_SCOPE === 'PRODUCTION'
    if (isProduction && opts?.failOpen !== true) {
      log.error('Rate limiter not configured in PRODUCTION — failing closed')
      return { success: false, remaining: 0 }
    }
    return { success: true, remaining: 999 }
  }
  const result = await limiter.limit(identifier)
  return { success: result.success, remaining: result.remaining }
}

/**
 * Stricter limiter for sensitive endpoints (login, waitlist, building creation).
 */
type Duration = `${number} ${'ms' | 's' | 'm' | 'h' | 'd'}` | `${number}${'ms' | 's' | 'm' | 'h' | 'd'}`

const strictLimiter: Record<string, Ratelimit | null> = {}

function getStrictRateLimiter(window: Duration, max: number): Ratelimit | null {
  if (!redisUrl || !redisToken) return null
  const key = `${window}:${max}`
  if (!strictLimiter[key]) {
    strictLimiter[key] = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(max, window),
      analytics: true,
    })
  }
  return strictLimiter[key]
}

export async function checkStrictRateLimit(
  identifier: string,
  max: number,
  window: Duration
): Promise<{ success: boolean; remaining: number }> {
  const limiter = getStrictRateLimiter(window, max)
  if (!limiter) {
    const isProduction = process.env.APP_SCOPE === 'PRODUCTION'
    if (isProduction) {
      log.error('Strict rate limiter not configured in PRODUCTION — failing closed')
      return { success: false, remaining: 0 }
    }
    return { success: true, remaining: 999 }
  }
  const result = await limiter.limit(identifier)
  return { success: result.success, remaining: result.remaining }
}

/**
 * Extract a rate-limit identifier from a Request (IP or user ID).
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  return `ip:${ip}`
}
