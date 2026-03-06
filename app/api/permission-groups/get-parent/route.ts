import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(backendUrl('/user/permission-group/get-parent'), {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups get-parent]', e);
    return NextResponse.json({ message: 'Failed to fetch permission groups' }, { status: 500 });
  }
}
