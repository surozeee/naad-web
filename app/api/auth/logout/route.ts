import { NextResponse } from 'next/server';
import { buildClearSessionCookieHeaders } from '@/lib/clear-session-cookies';
import { getServerApiBase } from '@/lib/server-api-base';
import { serverFetch } from '@/lib/server-fetch';

export interface LogoutBody {
  refreshToken?: string;
}

/**
 * Proxies logout to the backend so refresh tokens can be invalidated.
 * Always returns 200 so the client can clear the NextAuth session.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as LogoutBody;
    const refreshToken = body?.refreshToken;

    const xsrf = process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    if (xsrf) {
      headers['X-XSRF-TOKEN'] = xsrf;
      headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
    }

    const API_BASE = getServerApiBase();
    await serverFetch(`${API_BASE}/api/v2/public/user/logout`, {
      method: 'POST',
      headers,
      body: refreshToken ? JSON.stringify({ refreshToken }) : '{}',
    });

    const response = NextResponse.json({ ok: true });
    // Also clear legacy naad cookies if present
    response.cookies.set('naad_auth', '', { path: '/', maxAge: 0 });
    response.cookies.set('naad_refresh', '', { path: '/', maxAge: 0 });
    buildClearSessionCookieHeaders().forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });
    return response;
  } catch {
    const response = NextResponse.json({ ok: true });
    response.cookies.set('naad_auth', '', { path: '/', maxAge: 0 });
    response.cookies.set('naad_refresh', '', { path: '/', maxAge: 0 });
    buildClearSessionCookieHeaders().forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });
    return response;
  }
}
