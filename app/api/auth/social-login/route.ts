import { NextResponse } from 'next/server';
import { buildLoginSessionResponse } from '@/lib/login-session';
import { classifyBackendFetchError, getServerApiBase } from '@/lib/server-api-base';
import { serverFetch } from '@/lib/server-fetch';
import { resolveServerXsrfHeaders } from '@/lib/server-xsrf';

export const dynamic = 'force-dynamic';

export interface SocialLoginBody {
  provider: 'GOOGLE' | 'FACEBOOK' | string;
  idToken?: string;
  accessToken?: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    let body: SocialLoginBody;
    try {
      body = (await request.json()) as SocialLoginBody;
    } catch {
      return NextResponse.json(
        { message: 'Invalid request body.', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const provider = String(body?.provider ?? '').trim().toUpperCase();
    const idToken = body?.idToken?.trim() || undefined;
    const accessToken = body?.accessToken?.trim() || undefined;
    const name = body?.name?.trim() || undefined;

    if (!provider || (provider !== 'GOOGLE' && provider !== 'FACEBOOK')) {
      return NextResponse.json(
        { message: 'Provider must be GOOGLE or FACEBOOK.', code: 'INVALID_PROVIDER' },
        { status: 400 }
      );
    }
    if (!idToken && !accessToken) {
      return NextResponse.json(
        { message: 'idToken or accessToken is required.', code: 'TOKEN_REQUIRED' },
        { status: 400 }
      );
    }

    const API_BASE = getServerApiBase();
    if (!API_BASE) {
      return NextResponse.json(
        {
          message:
            'API base not configured on the server. Set BACKEND_URL or NEXT_PUBLIC_API_URL.',
          code: 'API_NOT_CONFIGURED',
        },
        { status: 502 }
      );
    }

    const { headers } = await resolveServerXsrfHeaders(API_BASE);
    const SOCIAL_URL = `${API_BASE}/api/v2/public/user/social-login`;

    const res = await serverFetch(SOCIAL_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        provider,
        idToken,
        accessToken,
        name,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        (data as { message?: string })?.message ??
        (data as { error?: string })?.error ??
        'Social login failed';
      return NextResponse.json(
        {
          ...(typeof data === 'object' && data ? data : {}),
          message,
          code: (data as { code?: string })?.code ?? `HTTP_${res.status}`,
        },
        { status: res.status >= 500 ? 502 : res.status }
      );
    }

    const userEmail =
      (data as { data?: { user?: { email?: string } } })?.data?.user?.email ??
      (data as { user?: { email?: string } })?.user?.email ??
      `${provider.toLowerCase()}@social.local`;

    return buildLoginSessionResponse(data, userEmail);
  } catch (error) {
    console.error('[Auth] Social login error:', error);
    const kind = classifyBackendFetchError(error);
    if (kind !== null) {
      return NextResponse.json(
        {
          message:
            kind === 'timeout'
              ? 'Connection to the API timed out.'
              : 'Cannot reach the API for social login.',
          code:
            kind === 'timeout'
              ? 'API_CONNECT_TIMEOUT'
              : kind === 'unreachable'
                ? 'API_UNREACHABLE'
                : 'API_FETCH_FAILED',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        message: 'Something went wrong during social login.',
        code: 'SOCIAL_LOGIN_INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
