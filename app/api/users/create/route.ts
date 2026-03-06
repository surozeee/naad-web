import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

const CREATE_PATH = '/user/create';

/** POST create user. Body: { emailAddress, mobileNumber?, password, roleId, status?, userDetail? }. Forwards to backend POST create. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(backendUrl(CREATE_PATH), {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API users create]', e);
    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}
