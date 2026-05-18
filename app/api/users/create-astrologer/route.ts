import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** Backend: POST /api/v2/user/astrologer/create */
const CREATE_ASTROLOGER_PATH = '/user/astrologer/create';

/** POST create astrologer user. Body: { emailAddress, mobileNumber?, password, userDetail? }. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(backendUrl(CREATE_ASTROLOGER_PATH), {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API users create-astrologer]', e);
    return NextResponse.json({ message: 'Failed to create astrologer user' }, { status: 500 });
  }
}
