import type { User, UserRole } from '@/lib/types'
import { verifyClerkToken, getTokenFromHeader } from './verifyToken'

/**
 * Enhanced function to map Clerk user to app User type
 * Uses the actual Clerk user ID as the primary identifier
 */
export function userFromClerkEnhanced(clerkUser: any): User {
  // Extract role from public metadata, fallback to 'usuario'
  const roleFromMeta = clerkUser.public_metadata?.role
  const validRoles: UserRole[] = ['super_admin', 'admin', 'vigilante', 'usuario']
  const role: UserRole = validRoles.includes(roleFromMeta as UserRole) 
    ? (roleFromMeta as UserRole) 
    : 'usuario'

  // Extract name from various sources
  const name = 
    clerkUser.first_name && clerkUser.last_name
      ? `${clerkUser.first_name} ${clerkUser.last_name}`
      : clerkUser.username
      || clerkUser.primary_email_address?.email_address?.split('@')[0]
      || 'Usuario'

  return {
    // Use the actual Clerk user ID as the primary identifier
    id: clerkUser.id,
    email: clerkUser.primary_email_address?.email_address || '',
    name,
    role,
    buildingId: clerkUser.public_metadata?.buildingId || undefined,
    avatar: clerkUser.image_url || undefined
  }
}

/**
 * Middleware to verify Clerk token and attach user info to request
 * This would be used in API routes to validate authenticated requests
 */
export async function clerkAuthMiddleware(request: Request) {
  const authHeader = request.headers.get('authorization')
  const token = getTokenFromHeader(authHeader)

  if (!token) {
    return { 
      isAuthenticated: false, 
      error: 'No token provided' 
    }
  }

  try {
    const payload = await verifyClerkToken(token)
    
    // Extract user info from token payload
    const clerkUser = {
      id: payload.sub,
      email: payload.email,
      first_name: payload.first_name,
      last_name: payload.last_name,
      username: payload.username,
      public_metadata: payload.public_metadata || {},
      image_url: payload.picture
    }

    const user = userFromClerkEnhanced(clerkUser)
    
    return {
      isAuthenticated: true,
      user,
      clerkUser,
      tokenPayload: payload
    }
  } catch (error) {
    return { 
      isAuthenticated: false, 
      error: 'Invalid or expired token' 
    }
  }
}

/**
 * Get current user from Zustand store (client-side)
 * This is used in React components
 */
export function getCurrentUserFromStore() {
  // This would be implemented using your Zustand store
  // For now, returning null as placeholder
  return null
}