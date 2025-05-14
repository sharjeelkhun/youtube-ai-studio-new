import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Check if we're in a preview environment
  const isPreview =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    request.headers.get("host")?.includes("v0.dev")

  // Skip auth check in preview mode
  if (isPreview) {
    // For dashboard routes in preview, just allow access
    if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/connect-channel")) {
      return NextResponse.next()
    }

    // For login/signup pages in preview, also allow access
    if (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") {
      return NextResponse.next()
    }

    // Redirect root to login in preview
    if (request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    return NextResponse.next()
  }

  // Create supabase middleware client
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  // Refresh session if expired
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Auth condition for protected routes
  if (
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/connect-channel") ||
      request.nextUrl.pathname.startsWith("/profile")) &&
    !session
  ) {
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Auth condition for auth pages when already logged in
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup") && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect root to dashboard if logged in, otherwise to login
  if (request.nextUrl.pathname === "/") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|api|favicon.ico).*)",
  ],
}
