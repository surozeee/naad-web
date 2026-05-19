import { NextResponse } from 'next/server';
import { API_BASE, backendFetch, getBackendNetworkErrorMessage, isBackendNetworkError } from '@/app/lib/api-base';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

const VERIFY_OTP_URL = `${API_BASE}/api/v2/public/user/verify-otp`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string };
    const email = body?.email?.trim();
    const otp = body?.otp?.trim();
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
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
    const res = await backendFetch(VERIFY_OTP_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, otp }),
    });
    const data = (await res.json().catch(() => ({}))) as { data?: { uuid?: string }; message?: string };
    if (!res.ok) {
      return NextResponse.json(
        data?.message ? { ...data, message: data.message } : data,
        { status: res.status }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Auth] Verify OTP error:', error);
    return NextResponse.json(
      { message: getBackendNetworkErrorMessage(error) },
      { status: isBackendNetworkError(error) ? 503 : 500 }
    );
  }
}
