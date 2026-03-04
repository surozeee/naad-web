import { NextResponse } from 'next/server';

// API base from .env (same as login/refresh)
const rawApiUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_AUTH_API_URL ?? '').trim();
const API_BASE = rawApiUrl.replace(/\/api\/v2\/?$/i, '').replace(/\/api\/?$/, '');
const LOGOUT_URL = API_BASE ? `${API_BASE}/api/v2/public/user/logout` : '';

const AUTH_COOKIE = 'naad_auth';
const REFRESH_COOKIE = 'naad_refresh';
const CLEAR_COOKIE = { path: '/', maxAge: 0 };

export interface LogoutBody {
  refreshToken?: string;
}

/** Clear cookies and call backend logout: POST .../api/v2/public/user/logout with refreshToken. */
export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, '', CLEAR_COOKIE);
  res.cookies.set(REFRESH_COOKIE, '', CLEAR_COOKIE);

  try {
    let refreshToken: string | undefined;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = (await request.json().catch(() => ({}))) as LogoutBody;
      refreshToken = body?.refreshToken?.trim() || undefined;
    }
    if (!refreshToken) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + REFRESH_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
      refreshToken = match ? decodeURIComponent(match[1].trim()) : undefined;
    }

    if (LOGOUT_URL) {
      const xsrfFromRequest = request.headers.get('X-XSRF-TOKEN')?.trim();
      const xsrf = xsrfFromRequest || process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
      const headers: Record<string, string> = {
        accept: '*/*',
        'Content-Type': 'application/json',
      };
      if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
        headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
      }
      await fetch(LOGOUT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ refreshToken: refreshToken || '' }),
      });
    }
  } catch {
    // Always return success so client can sign out locally
  }
  return res;
}
