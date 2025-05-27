import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Check if we're in the v0 preview environment
const isPreviewEnvironment = (request: NextRequest) => {
  return request.headers.get("host")?.includes("vusercontent.net") || request.headers.get("host") === "v0.dev"
}

export async function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Check if we're in preview mode
  const isPreview = isPreviewEnvironment(request)

  // For preview mode, check for a special cookie
  if (isPreview) {
    const previewLoggedIn = request.cookies.get("preview_logged_in")?.value === "true"

    // Public paths that don't require authentication
    const isPublicPath = path === "/login" || path === "/signup" || path === "/forgot-password"

    // If user is not logged in and the path is not public, redirect to login
    if (!previewLoggedIn && !isPublicPath) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // If user is logged in and the path is public, redirect to dashboard
    if (previewLoggedIn && isPublicPath) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
  }

  // For real environments, use Supabase auth
  // Public paths that don't require authentication
  const isPublicPath = path === "/login" || path === "/signup" || path === "/forgot-password"

  // Get the session from the request
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase credentials are missing, allow access
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })

  const { data } = await supabase.auth.getSession()

  // If user is not logged in and the path is not public, redirect to login
  if (!data.session && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If user is logged in and the path is public, redirect to dashboard
  if (data.session && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// Only run middleware on these paths
export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard/:path*", "/settings/:path*", "/profile/:path*"],
}
