import { NextResponse } from 'next/server';

/**
 * Returns the gateway's AES-encrypted XSRF token from env and sets it in a cookie.
 * The Api-Gateway decrypts X-XSRF-TOKEN and compares to aes.xsrfToken (403 if missing/invalid).
 * Set in .env: NEXTAUTH_XSRF_TOKEN=<encrypted_base64_value>
 * (Backend team: encrypt aes.xsrfToken with the gateway AES key and provide the Base64 string.)
 */
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export async function GET() {
  const token = process.env.NEXTAUTH_XSRF_TOKEN?.trim();
  const response = NextResponse.json({ ok: !!token });
  if (token) {
    response.cookies.set('XSRF-TOKEN', token, COOKIE_OPTIONS);
  }
  return response;
}
