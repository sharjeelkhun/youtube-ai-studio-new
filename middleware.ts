import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// Check if we're in a preview environment
const isPreviewEnvironment = (request: NextRequest) => {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    request.headers.get("host")?.includes("v0.dev") ||
    request.headers.get("host")?.includes("lite.vusercontent.net")
  )
}

export async function middleware(request: NextRequest) {
  // Create response to modify
  const res = NextResponse.next()

  // Check if we're in preview mode
  const isPreview = isPreviewEnvironment(request)

  // Initialize session
  let session = null

  // Handle authentication
  if (!isPreview) {
    try {
      // Create Supabase middleware client
      const supabase = createMiddlewareClient({ req: request, res })

      // Get session
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error("Middleware session error:", error)
      } else {
        session = data.session
      }
    } catch (error) {
      console.error("Middleware error:", error)
    }
  } else {
    // For preview mode, check for preview login cookie
    const previewLoggedIn = request.cookies.get("preview_logged_in")?.value === "true"

    if (previewLoggedIn) {
      // Simulate a session for preview mode
      session = { user: { id: "preview-user" } } as any
    }
  }

  // Get current path
  const path = request.nextUrl.pathname

  // Protected routes
  const protectedRoutes = ["/dashboard", "/(dashboard)", "/connect-channel", "/profile", "/settings"]

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // Auth pages
  const authPages = ["/login", "/signup", "/forgot-password"]
  const isAuthPage = authPages.includes(path)

  // Handle protected routes
  if (isProtectedRoute && !session) {
    // Redirect to login with return URL
    const redirectUrl = new URL("/login", request.url)
    redirectUrl.searchParams.set("redirect", path)
    return NextResponse.redirect(redirectUrl)
  }

  // Handle auth pages when already logged in
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Handle root path
  if (path === "/") {
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
