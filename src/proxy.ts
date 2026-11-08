import { auth } from '@/server/auth';
import { NextResponse } from 'next/server';

/**
 * Next.js 16 "proxy" (formerly middleware). Runs on the Node.js runtime.
 * Protects every non-login route: unauthenticated users are redirected to
 * /login; logged-in users hitting /login are sent to the dashboard; the
 * Users admin page additionally requires the ADMIN role.
 */
export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const isAuthPage = nextUrl.pathname.startsWith('/login');

  // Not logged in and not already on the login page → send to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // Already logged in but visiting the login page → send to dashboard
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard/overview', nextUrl));
  }

  // Users page is ADMIN-only (defense in depth; server actions also enforce this)
  if (nextUrl.pathname.startsWith('/dashboard/users') && session?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/overview', nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
