import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Check if we're in a preview environment
  const isPreview =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    request.headers.get("host")?.includes("v0.dev")

  // Create response to modify
  const res = NextResponse.next()

  // Create supabase middleware client
  let session = null

  if (!isPreview) {
    const supabase = createMiddlewareClient({ req: request, res })
    // Refresh session if expired
    const { data } = await supabase.auth.getSession()
    session = data.session
  }

  // For preview mode, we'll create a simulated session based on a special cookie
  if (isPreview) {
    const previewLoggedIn = request.cookies.get("preview_logged_in")?.value === "true"
    if (previewLoggedIn) {
      // Simulate a session for preview mode
      session = { user: { id: "preview-user" } } as any
    }
  }

  // Auth condition for protected routes - ALWAYS check regardless of preview mode
  if (
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/(dashboard)") ||
      request.nextUrl.pathname.startsWith("/connect-channel") ||
      request.nextUrl.pathname.startsWith("/profile") ||
      request.nextUrl.pathname.startsWith("/settings")) &&
    !session
  ) {
    // Redirect to login with return URL
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
     * - public folder
     */
    "/((?!_next/static|_next/image|api|favicon.ico|public).*)",
  ],
}
