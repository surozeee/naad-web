import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

function listBody(body: unknown) {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  return {
    pageNo: b.pageNo ?? 0,
    pageSize: b.pageSize ?? 1000,
    ...(b.search != null && b.search !== '' && { search: String(b.search).trim() }),
    ...(b.sortBy != null && { sortBy: b.sortBy }),
    ...(b.sortDirection != null && { sortDirection: b.sortDirection }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = listBody(body);
    const res = await fetch(backendUrl('/user/permission-group/get-active-last-child'), {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permission-groups get-active-last-child]', e);
    return NextResponse.json({ message: 'Failed to fetch permission groups' }, { status: 500 });
  }
}
