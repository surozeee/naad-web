import { NextResponse } from 'next/server';

const rawApiUrl = (process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? '').trim();
const API_BASE = rawApiUrl.replace(/\/api\/v2\/?$/i, '').replace(/\/api\/?$/, '');
const AUTH_COOKIE = 'naad_auth';
const REFRESH_COOKIE = 'naad_refresh';

export interface LogoutBody {
  refreshToken?: string;
}

const CLEAR_COOKIE = { path: '/', maxAge: 0 };

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, '', CLEAR_COOKIE);
  res.cookies.set(REFRESH_COOKIE, '', CLEAR_COOKIE);

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

    if (API_BASE) {
      await fetch(`${API_BASE}/api/v2/public/user/logout`, {
        method: 'POST',
        headers,
        body: refreshToken ? JSON.stringify({ refreshToken }) : '{}',
      });
    }
  } catch {
    // Always return success so client can sign out locally
  }
  return res;
}
