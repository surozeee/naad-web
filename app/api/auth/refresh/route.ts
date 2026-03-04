import { NextResponse } from 'next/server';

// API base from .env (NEXT_PUBLIC_BACKEND_URL or NEXT_PUBLIC_API_URL)
const rawApiUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_AUTH_API_URL ?? '').trim();
const API_BASE = rawApiUrl.replace(/\/api\/v2\/?$/i, '').replace(/\/api\/?$/, '');
const REFRESH_URL = API_BASE ? `${API_BASE}/api/v2/public/user/refresh/token` : '';

const AUTH_COOKIE = 'naad_auth';
const REFRESH_COOKIE = 'naad_refresh';
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};
const CLEAR_COOKIE = { path: '/', maxAge: 0 };

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, '', CLEAR_COOKIE);
  response.cookies.set(REFRESH_COOKIE, '', CLEAR_COOKIE);
}

/** Refresh access token. On error, clear cookies and return 401 so client redirects to login. */
export async function POST(request: Request) {
  try {
    let refreshToken: string | null = null;
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = (await request.json().catch(() => ({}))) as { refreshToken?: string };
      refreshToken = body?.refreshToken?.trim() || null;
    }
    if (!refreshToken) {
      const cookieHeader = request.headers.get('cookie') || '';
      const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + REFRESH_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
      refreshToken = match ? decodeURIComponent(match[1].trim()) : null;
    }
    if (!refreshToken) {
      const res = NextResponse.json({ message: 'Refresh token required' }, { status: 401 });
      clearAuthCookies(res);
      return res;
    }

    if (!REFRESH_URL) {
      const res = NextResponse.json(
        { message: 'Auth API not configured. Set NEXT_PUBLIC_BACKEND_URL in .env' },
        { status: 503 }
      );
      clearAuthCookies(res);
      return res;
    }

    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    const xsrfFromRequest = request.headers.get('X-XSRF-TOKEN')?.trim();
    const xsrf = xsrfFromRequest || process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
    if (xsrf) {
      headers['X-XSRF-TOKEN'] = xsrf;
      headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
    }

    const res = await fetch(REFRESH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      message?: string;
      data?: {
        accessToken?: string;
        access_token?: string;
        refreshToken?: string;
        refresh_token?: string;
      };
      access_token?: string;
      refresh_token?: string;
    };

    if (!res.ok || data?.status === 'FAILED') {
      const errRes = NextResponse.json(
        { message: data?.message ?? 'Session expired. Please sign in again.' },
        { status: 401 }
      );
      clearAuthCookies(errRes);
      return errRes;
    }

    const access_token =
      data.data?.accessToken ?? data.data?.access_token ?? data.access_token ?? '';
    const new_refresh =
      data.data?.refreshToken ?? data.data?.refresh_token ?? data.refresh_token ?? refreshToken;

    if (!access_token) {
      const errRes = NextResponse.json(
        { message: 'Invalid refresh response' },
        { status: 502 }
      );
      clearAuthCookies(errRes);
      return errRes;
    }

    const response = NextResponse.json({
      access_token,
      refresh_token: new_refresh,
    });
    response.cookies.set(AUTH_COOKIE, access_token, COOKIE_OPTIONS);
    response.cookies.set(REFRESH_COOKIE, new_refresh, COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error('[Auth] Refresh error:', error);
    const res = NextResponse.json(
      { message: 'Refresh failed' },
      { status: 500 }
    );
    clearAuthCookies(res);
    return res;
  }
}
