import { NextResponse } from 'next/server';
import {
  API_BASE,
  backendFetch,
  getBackendHttpErrorMessage,
  getBackendNetworkErrorMessage,
  isBackendNetworkError,
} from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

const LOGIN_URL = `${API_BASE}/api/v2/public/user/login`;

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  USR007: 'Failed to generate authentication token. Please try again in a moment.',
  IAM007: 'Your account has been locked due to multiple failed login attempts. Please try again later or contact support.',
};

function resolveLoginErrorMessage(data: {
  code?: string;
  message?: string;
  error?: string;
}): string {
  const code = data?.code?.trim();
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];
  const message = data?.message ?? data?.error;
  if (message?.trim()) return message.trim();
  if (code === 'USR007') return AUTH_ERROR_MESSAGES.USR007;
  return 'Invalid email or password.';
}

const AUTH_COOKIE = 'naad_auth';
const REFRESH_COOKIE = 'naad_refresh';
const COOKIE_OPTIONS = {
  path: '/',
  /** Match long-lived refresh token (e.g. 10d); access token is short — see proactive refresh. */
  maxAge: 60 * 60 * 24 * 10,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Invalid username and password' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const xsrf = getServerXsrfToken() || request.headers.get('X-XSRF-TOKEN')?.trim() || undefined;
    if (xsrf) headers['X-XSRF-TOKEN'] = xsrf;

    const loginBody = JSON.stringify({ email: email.trim(), password });
    let res = await backendFetch(LOGIN_URL, {
      method: 'POST',
      headers,
      body: loginBody,
    });

    let data = (await res.json().catch(() => ({}))) as {
      status?: string;
      code?: string;
      message?: string;
      error?: string;
      data?: {
        accessToken?: string;
        access_token?: string;
        refreshToken?: string;
        refresh_token?: string;
        user?: Record<string, unknown>;
      };
    };

    if (data?.status === 'FAILED' && data?.code === 'USR007' && !res.ok) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      res = await backendFetch(LOGIN_URL, {
        method: 'POST',
        headers,
        body: loginBody,
      });
      data = (await res.json().catch(() => ({}))) as typeof data;
    }

    if (data?.status === 'FAILED') {
      const message = resolveLoginErrorMessage(data);
      const status =
        data.code === 'USR007' ? 503 : res.status === 401 || res.status === 403 ? 401 : res.ok ? 401 : res.status;
      console.error('[Auth] Login backend error:', res.status, LOGIN_URL, data);
      return NextResponse.json({ message, code: data?.code }, { status });
    }

    if (!res.ok) {
      const message = getBackendHttpErrorMessage(
        res.status,
        LOGIN_URL,
        data?.message ?? data?.error
      );
      console.error('[Auth] Login backend error:', res.status, LOGIN_URL, data);
      return NextResponse.json(
        { message, code: data?.code },
        { status: res.status === 404 ? 502 : res.status }
      );
    }

    const access_token =
      data.data?.accessToken ?? data.data?.access_token ?? '';
    const refresh_token =
      data.data?.refreshToken ?? data.data?.refresh_token ?? '';

    if (!access_token) {
      return NextResponse.json(
        { message: 'Invalid response from authentication service.' },
        { status: 502 }
      );
    }

    const response = NextResponse.json(data);

    response.cookies.set(AUTH_COOKIE, access_token, COOKIE_OPTIONS);
    if (refresh_token) {
      response.cookies.set(REFRESH_COOKIE, refresh_token, COOKIE_OPTIONS);
    }

    let xsrfValue: string | null = null;
    const setCookies =
      typeof (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (res.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
        : res.headers.get('set-cookie')
          ? [res.headers.get('set-cookie')!]
          : [];
    for (const raw of setCookies) {
      const c = raw.trim();
      const xsrfMatch = /^XSRF-TOKEN=(.+?)(?:;\s|$)/i.exec(c) || /^X-XSRF-TOKEN=(.+?)(?:;\s|$)/i.exec(c);
      if (xsrfMatch) {
        xsrfValue = xsrfMatch[1].replace(/^"(.*)"$/, '$1').trim();
        break;
      }
    }
    const xsrfToSet = xsrfValue || getServerXsrfToken() || process.env.NEXT_PUBLIC_XSRF_TOKEN?.trim();
    if (xsrfToSet) {
      response.cookies.set('XSRF-TOKEN', xsrfToSet, COOKIE_OPTIONS);
    }

    return response;
  } catch (error) {
    console.error('[Auth] Login API error:', error);
    if (isBackendNetworkError(error)) {
      console.error('[Auth] Backend URL:', LOGIN_URL);
    }
    return NextResponse.json(
      { message: getBackendNetworkErrorMessage(error) },
      { status: isBackendNetworkError(error) ? 503 : 500 }
    );
  }
}
