import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const hasClerk =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) &&
  Boolean(process.env.CLERK_SECRET_KEY?.trim())

const clerkHandler = hasClerk ? clerkMiddleware() : null

export default function middleware(
  request: NextRequest,
  event: import('next/server').NextFetchEvent
) {
  if (!clerkHandler) {
    return NextResponse.next()
  }
  
  return clerkHandler(request, event)
}

export const config = {
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
