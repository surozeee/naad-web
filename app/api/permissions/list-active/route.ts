import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function GET(request: NextRequest) {
  try {
    const url = backendUrl('/user/permission/list-active');
    const res = await fetch(url, {
      method: 'GET',
      headers: backendHeaders(request),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permissions list-active]', e);
    return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
  }
}
