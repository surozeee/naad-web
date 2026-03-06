import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

export async function GET(request: NextRequest) {
  try {
    const res = await fetch(backendUrl('/user/permission-group/active-tree-only-with-permissions'), {
      method: 'GET',
      headers: backendHeaders(request),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups active-tree]', e);
    return NextResponse.json({ message: 'Failed to fetch permission group tree' }, { status: 500 });
  }
}
