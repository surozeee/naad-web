import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(backendUrl('/user/meetings/my'), {
      method: 'GET',
      headers: backendHeaders(request),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API meetings my]', e);
    return NextResponse.json({ message: 'Failed to fetch meetings' }, { status: 500 });
  }
}
