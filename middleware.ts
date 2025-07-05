import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check if this is a logout request
  const isLogout = req.nextUrl.searchParams.get('logout');
  
  // If it's a logout request, don't redirect back to dashboard
  if (isLogout) {
    return res;
  }

  // Refresh session if expired
  const { data: { session } } = await supabase.auth.getSession();

  // If no session and trying to access protected routes, redirect to login
  if (!session && req.nextUrl.pathname.startsWith('/videos')) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/videos/:path*',
    '/settings/:path*',
    '/dashboard/:path*'
  ]
};
