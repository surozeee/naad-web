import { NextResponse } from 'next/server';
import { getServerXsrfToken } from '@/app/lib/get-xsrf';

const API_BASE = (process.env.NEXT_PUBLIC_AUTH_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '');
const FORGOT_PASSWORD_URL = `${API_BASE}/api/v2/public/user/forgot-password`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body?.email?.trim();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    if (API_BASE) {
      const headers: Record<string, string> = {
        accept: '*/*',
        'Content-Type': 'application/json',
      };
      const xsrf = getServerXsrfToken() || undefined;
      if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
        headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
      }
      const res = await fetch(FORGOT_PASSWORD_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          (data as { message?: string }).message ? { ...data, message: (data as { message?: string }).message } : data,
          { status: res.status }
        );
      }
      return NextResponse.json(data);
    }

    // Mock success when no API URL (demo mode)
    return NextResponse.json({ message: 'If an account exists, you will receive an OTP shortly.' });
  } catch (error) {
    console.error('[Auth] Forgot password error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
