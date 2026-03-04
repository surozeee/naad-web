import { NextResponse } from 'next/server';

// Login API: https://api-naad.jojolapatech.com/api/v2/public/user/login
const DEFAULT_API_BASE = 'https://api-naad.jojolapatech.com';
const rawApiUrl = (process.env.NEXT_PUBLIC_AUTH_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL ?? DEFAULT_API_BASE).trim();
const API_BASE = rawApiUrl.replace(/\/api\/v2\/?$/i, '').replace(/\/api\/?$/, '') || DEFAULT_API_BASE;
const LOGIN_URL = `${API_BASE}/api/v2/public/user/login`;

const AUTH_COOKIE = 'naad_auth';
const REFRESH_COOKIE = 'naad_refresh';
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
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
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    const xsrfFromRequest = request.headers.get('X-XSRF-TOKEN')?.trim();
    const xsrf = xsrfFromRequest || process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
    if (xsrf) {
      headers['X-XSRF-TOKEN'] = xsrf;
      headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
    }

    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    });

    const data = (await res.json().catch(() => ({}))) as {
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

    if (!res.ok) {
      const message = data?.message ?? data?.error ?? 'Invalid email or password.';
      return NextResponse.json({ message }, { status: res.status });
    }

    if (data?.status === 'FAILED') {
      const message = data?.message ?? 'Invalid email or password.';
      return NextResponse.json({ message, code: data?.code }, { status: 401 });
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

    // Forward backend XSRF cookie so client can send it on forgot-password etc.
    const setCookies =
      typeof (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (res.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
        : res.headers.get('set-cookie')
          ? [res.headers.get('set-cookie')!]
          : [];
    for (const raw of setCookies) {
      const c = raw.trim();
      if (/^XSRF-TOKEN=/i.test(c) || /^X-XSRF-TOKEN=/i.test(c)) {
        response.headers.append('Set-Cookie', c);
        break;
      }
    }

    return response;
  } catch (error) {
    console.error('[Auth] Login API error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
