import { NextResponse } from 'next/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '');
const AUTH_COOKIE = 'naad_auth';

export interface RefreshBody {
  refreshToken: string;
  id?: string;
  email?: string;
  name?: string | null;
}

export interface RefreshApiResponse {
  status?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
  access_token?: string;
  refresh_token?: string;
}

/** Refresh access token using backend refresh endpoint (same flow as erp-web). */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RefreshBody;
    const refreshToken = body?.refreshToken;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'refreshToken is required' },
        { status: 400 }
      );
    }

    if (!API_BASE) {
      return NextResponse.json(
        { message: 'Refresh not available in demo mode' },
        { status: 400 }
      );
    }

    const xsrf = process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    if (xsrf) {
      headers['X-XSRF-TOKEN'] = xsrf;
      headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
    }

    const res = await fetch(`${API_BASE}/api/v2/public/user/refresh/token`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    const data = (await res.json().catch(() => ({}))) as RefreshApiResponse;

    if (!res.ok) {
      return NextResponse.json(
        data || { message: 'Refresh failed' },
        { status: res.status }
      );
    }

    const access_token =
      data.data?.accessToken ??
      data.data?.access_token ??
      data.access_token ??
      '';
    const refresh_token =
      data.data?.refreshToken ??
      data.data?.refresh_token ??
      data.refresh_token ??
      refreshToken;

    if (!access_token) {
      return NextResponse.json(
        { message: 'No access_token in refresh response' },
        { status: 502 }
      );
    }

    const response = NextResponse.json({
      access_token,
      refresh_token,
    });

    response.cookies.set(AUTH_COOKIE, access_token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (error) {
    console.error('[Auth] Refresh API error:', error);
    return NextResponse.json(
      { message: 'Refresh failed' },
      { status: 500 }
    );
  }
}
