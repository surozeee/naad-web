import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Cookie name used for auth (must match login API and client). */
const AUTH_COOKIE = 'naad_auth';

/** Path prefixes that require authentication (same as DashboardLayout-protected app areas). */
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/horoscope',
  '/astrology',
  '/puja',
  '/music',
  '/palmistry',
  '/customer',
  '/event-management',
  '/user-management',
  '/master-setting',
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/', request.url);
  loginUrl.searchParams.set('login', '1');
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/horoscope/:path*',
    '/astrology/:path*',
    '/puja/:path*',
    '/music/:path*',
    '/palmistry/:path*',
    '/customer/:path*',
    '/event-management/:path*',
    '/user-management/:path*',
    '/master-setting/:path*',
  ],
};
