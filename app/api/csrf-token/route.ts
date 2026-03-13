import { NextResponse } from 'next/server';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

/**
 * Returns the XSRF token (from env or static fallback). Sets cookie and body so client can send X-XSRF-TOKEN.
 * Token is always available; override with NEXTAUTH_XSRF_TOKEN or NEXT_AUTH_XSRF_TOKEN in .env.
 */
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export async function GET() {
  const token = getServerXsrfToken();
  const response = NextResponse.json({ ok: true, token });
  response.cookies.set('XSRF-TOKEN', token, COOKIE_OPTIONS);
  return response;
}
