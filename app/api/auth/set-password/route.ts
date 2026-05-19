import { NextResponse } from 'next/server';
import { API_BASE, backendFetch, getBackendNetworkErrorMessage, isBackendNetworkError } from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

const SET_PASSWORD_URL = `${API_BASE}/api/v2/public/user/set-password`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      uuid?: string;
      otp?: string;
      newPassword?: string;
      confirmPassword?: string;
    };
    const { uuid, otp, newPassword, confirmPassword } = body ?? {};

    if (!uuid || !otp || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { message: 'UUID, OTP, new password and confirm password are required' },
        { status: 400 }
      );
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Passwords do not match' }, { status: 400 });
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
    const res = await backendFetch(SET_PASSWORD_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ uuid, otp, newPassword, confirmPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        (data as { message?: string }).message ? { ...data, message: (data as { message?: string }).message } : data,
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Auth] Set password error:', error);
    return NextResponse.json(
      { message: getBackendNetworkErrorMessage(error) },
      { status: isBackendNetworkError(error) ? 503 : 500 }
    );
  }
}
