import { jwtVerify } from 'jose'
import { logger } from '@/lib/logger'

const CLERK_JWKS_URL = 'https://api.clerk.dev/v1/jwks'

let jwksCache: any = null
let jwksCacheTime = 0
const JWKS_CACHE_TTL = 5 * 60 * 1000

const log = logger.child({ module: 'auth/verifyToken' })

async function getJWKS() {
  const now = Date.now()
  if (jwksCache && (now - jwksCacheTime < JWKS_CACHE_TTL)) {
    return jwksCache
  }

  const response = await fetch(CLERK_JWKS_URL)
  if (!response.ok) {
    throw new Error('Failed to fetch Clerk JWKS')
  }
  const data = await response.json()
  jwksCache = data
  jwksCacheTime = now
  return data
}

export async function verifyClerkToken(token: string) {
  try {
    const jwks = await getJWKS()
    const { payload } = await jwtVerify(token, jwks)
    return payload
  } catch (error) {
    log.error({ error }, 'Failed to verify Clerk token')
    throw new Error('Invalid or expired token')
  }
}

export function getTokenFromHeader(header: string | undefined): string | null {
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}
