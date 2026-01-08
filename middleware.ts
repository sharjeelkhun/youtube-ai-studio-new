import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect logged-in users away from login/signup
  if (user && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users from protected routes
  if (
    !user &&
    (pathname.startsWith("/dashboard") ||
      pathname.startsWith("/videos") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/setup") ||
      pathname.startsWith("/admin")) // Protect admin
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Check onboarding status for authenticated users
  if (user && !pathname.startsWith("/setup") && !pathname.startsWith("/api")) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      // If onboarding is not complete and user is trying to access protected routes
      if (
        profile &&
        !profile.onboarding_completed &&
        (pathname.startsWith("/dashboard") ||
          pathname.startsWith("/videos") ||
          pathname.startsWith("/settings") ||
          pathname.startsWith("/admin"))
      ) {
        return NextResponse.redirect(new URL("/setup", request.url));
      }

      // If onboarding is complete and user is on setup page, redirect to dashboard
      if (profile && profile.onboarding_completed && pathname === "/setup") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (important for auth flow)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth/callback).*)",
  ],
};