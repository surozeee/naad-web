import { NextResponse } from 'next/server';
import { buildLoginSessionResponse } from '@/lib/login-session';
import { classifyBackendFetchError, getServerApiBase } from '@/lib/server-api-base';
import { serverFetch } from '@/lib/server-fetch';
import { resolveServerXsrfHeaders } from '@/lib/server-xsrf';

export const dynamic = 'force-dynamic';

export interface LoginBody {
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    let body: LoginBody;
    try {
      body = (await request.json()) as LoginBody;
    } catch {
      return NextResponse.json(
        { message: 'Invalid request body. Email and password are required.', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Invalid username and password' },
        { status: 400 }
      );
    }

    const API_BASE = getServerApiBase();
    if (!API_BASE) {
      return NextResponse.json(
        {
          message:
            'API base not configured on the server. Set BACKEND_URL or NEXT_PUBLIC_API_URL, then rebuild or restart the app.',
          code: 'API_NOT_CONFIGURED',
        },
        { status: 502 }
      );
    }

    const { headers } = await resolveServerXsrfHeaders(API_BASE);
    if (process.env.NODE_ENV === 'development' && !headers['X-XSRF-TOKEN']) {
      console.warn(
        '[Auth] No XSRF token for login; set NEXTAUTH_XSRF_TOKEN or ensure backend sets XSRF-TOKEN on GET.'
      );
    }

    const LOGIN_URL = `${API_BASE}/api/v2/public/user/login`;

    const res = await serverFetch(LOGIN_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        (data as { message?: string })?.message ??
        (data as { error?: string })?.error ??
        (res.status === 502
          ? 'API gateway error. Check that User-Service and API Gateway are running.'
          : res.status >= 500
            ? 'Login service returned an error. Check the API / User-Service logs.'
            : 'Invalid username and password');
      return NextResponse.json(
        {
          ...(typeof data === 'object' && data ? data : {}),
          message:
            typeof message === 'string' && /^internal server error$/i.test(message.trim())
              ? 'Backend login failed (500). Verify credentials and that User-Service is healthy.'
              : message,
          code: (data as { code?: string })?.code ?? `HTTP_${res.status}`,
        },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    return buildLoginSessionResponse(data, email);
  } catch (error) {
    console.error('[Auth] Login API error:', error);
    const kind = classifyBackendFetchError(error);
    if (kind !== null) {
      const apiBase = getServerApiBase();
      return NextResponse.json(
        {
          message:
            kind === 'timeout'
              ? 'Connection to the API timed out. Check network or increase API_CONNECT_TIMEOUT_MS.'
              : kind === 'unreachable'
                ? 'Cannot reach the API from the web server. Set BACKEND_URL / API_INTERNAL_URL (and ensure the API is running).'
                : 'Could not connect to the API. Set BACKEND_URL or NEXT_PUBLIC_API_URL on the server.',
          code:
            kind === 'timeout'
              ? 'API_CONNECT_TIMEOUT'
              : kind === 'unreachable'
                ? 'API_UNREACHABLE'
                : 'API_FETCH_FAILED',
          ...(process.env.NODE_ENV === 'development'
            ? { attemptedBase: apiBase || '(empty)' }
            : {}),
        },
        { status: 503 }
      );
    }
    const detail = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        message:
          process.env.NODE_ENV === 'development'
            ? `Login failed: ${detail}`
            : 'Something went wrong. Please try again later.',
        code: 'LOGIN_INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
