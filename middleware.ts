import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const hasClerk =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()) &&
  Boolean(process.env.CLERK_SECRET_KEY?.trim())

const isPublicRoute = createRouteMatcher([
  '/sign-in',
  '/sign-up',
])

export default function middleware(
  request: NextRequest,
  event: import('next/server').NextFetchEvent
) {
  if (!hasClerk) {
    return NextResponse.next()
  }

  if (isPublicRoute(request)) {
    return NextResponse.next()
  }

  const handle = clerkMiddleware()
  return handle(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}
