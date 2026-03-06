import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const url = backendUrl('/user/permission/list-avaliable');
    const res = await fetch(url, {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permissions list-available]', e);
    return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
  }
}
