import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  await supabase.auth.getSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = req.nextUrl

  // Redirect authenticated users away from login/signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (
    !user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/videos") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/suggestions"))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};