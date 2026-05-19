import { NextResponse } from 'next/server';
import { API_BASE, backendFetch, getBackendNetworkErrorMessage, isBackendNetworkError } from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

const REGISTER_URL = `${API_BASE}/api/v2/public/user/register`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      confirmPassword?: string;
    };
    const { name, email, phone, password } = body ?? {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      accept: '*/*',
      'Content-Type': 'application/json',
    };
    const xsrf = getServerXsrfToken() || undefined;
    if (xsrf) {
      headers['X-XSRF-TOKEN'] = xsrf;
      headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
    }
    const res = await backendFetch(REGISTER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, email, phone, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: (data as { message?: string }).message ?? 'Registration failed' },
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Auth] Register error:', error);
    return NextResponse.json(
      { message: getBackendNetworkErrorMessage(error) },
      { status: isBackendNetworkError(error) ? 503 : 500 }
    );
  }
}
