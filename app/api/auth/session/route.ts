import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { buildClearSessionCookieHeaders } from '@/lib/clear-session-cookies';

export const dynamic = 'force-dynamic';

/**
 * Explicit session endpoint so NextAuth client does not depend on the
 * `[...nextauth]` catch-all (Turbopack on Windows often fails to register it).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json(session ?? {});
  } catch (error) {
    const msg = error instanceof Error ? `${error.name} ${error.message}` : '';
    if (/jwedecryptionfailed|decryption operation failed/i.test(msg)) {
      const res = NextResponse.json({});
      buildClearSessionCookieHeaders().forEach((cookie) => {
        res.headers.append('Set-Cookie', cookie);
      });
      return res;
    }
    console.error('[Auth] /api/auth/session error:', error);
    return NextResponse.json({}, { status: 200 });
  }
}
