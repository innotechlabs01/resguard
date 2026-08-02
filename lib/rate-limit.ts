import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

export async function checkRateLimit(identifier: string): Promise<{ success: boolean; remaining: number }> {
  const limiter = getRateLimiter()
  if (!limiter) {
    return { success: true, remaining: 999 }
  }
  const result = await limiter.limit(identifier)
  return { success: result.success, remaining: result.remaining }
}
