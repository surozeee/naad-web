import { NextResponse } from 'next/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '');
const VERIFY_OTP_URL = `${API_BASE}/api/v2/public/user/verify-otp`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; otp?: string };
    const email = body?.email?.trim();
    const otp = body?.otp?.trim();
    if (!email || !otp) {
      return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 });
    }

    if (API_BASE) {
      const headers: Record<string, string> = {
        accept: '*/*',
        'Content-Type': 'application/json',
      };
      const xsrf = process.env.NEXTAUTH_XSRF_TOKEN?.trim().replace(/[~\s]+$/, '') || undefined;
      if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf;
        headers['Cookie'] = `XSRF-TOKEN=${xsrf}`;
      }
      const res = await fetch(VERIFY_OTP_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json().catch(() => ({})) as { data?: { uuid?: string }; message?: string };
      if (!res.ok) {
        return NextResponse.json(
          data?.message ? { ...data, message: data.message } : data,
          { status: res.status }
        );
      }
      return NextResponse.json(data);
    }

    // Mock success when no API URL (demo mode)
    return NextResponse.json({ data: { uuid: 'mock-uuid-' + Date.now() } });
  } catch (error) {
    console.error('[Auth] Verify OTP error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
