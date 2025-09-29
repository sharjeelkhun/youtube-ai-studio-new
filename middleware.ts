import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const { supabase, response } = {
    supabase: createClient(),
    response: NextResponse.next({
      request: {
        headers: request.headers,
      },
    }),
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/videos') || pathname.startsWith('/settings') || pathname.startsWith('/suggestions'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}