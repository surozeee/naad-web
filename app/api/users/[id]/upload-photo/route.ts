import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** POST upload profile photo for a user (admin). Body: { encodedData }. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ message: 'User id required' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const headers = { ...backendHeaders(request), id };
    const res = await fetch(backendUrl('/user/upload-photo-for-user'), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API user upload-photo]', e);
    return NextResponse.json({ message: 'Failed to upload photo' }, { status: 500 });
  }
}
