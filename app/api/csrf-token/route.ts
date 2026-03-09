import { NextResponse } from 'next/server';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

/**
 * Returns the gateway's XSRF token from env and sets it in a cookie.
 * Set in .env: NEXTAUTH_XSRF_TOKEN or NEXT_AUTH_XSRF_TOKEN=<encrypted_base64_value>
 * All API requests send it as X-XSRF-TOKEN header to avoid 403.
 */
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export async function GET() {
  const token = getServerXsrfToken();
  const response = NextResponse.json({ ok: !!token });
  if (token) {
    response.cookies.set('XSRF-TOKEN', token, COOKIE_OPTIONS);
  }
  return response;
}
