import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

const LIST_PATH = '/user/permission/list';

function paginatePayload(body: unknown) {
  const b = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  return {
    pageNo: b.pageNo ?? 0,
    pageSize: b.pageSize ?? 10,
    ...(b.sortBy != null && { sortBy: b.sortBy }),
    ...(b.sortDirection != null && { sortDirection: b.sortDirection }),
    ...(b.search != null && b.search !== '' && { search: b.search }),
  };
}

/** GET list permissions (query params) - legacy. Prefer POST. */
export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl?.search?.toString() || '';
    const url = backendUrl(LIST_PATH) + search;
    const res = await fetch(url, { method: 'GET', headers: backendHeaders(request) });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permissions]', e);
    return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
  }
}

/** POST list permissions (paginated). Body: { pageNo, pageSize, sortBy?, sortDirection?, search? }. Forwards to backend POST list with body. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = paginatePayload(body);
    const url = backendUrl(LIST_PATH);
    const res = await fetch(url, {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API permissions POST]', e);
    return NextResponse.json({ message: 'Failed to fetch permissions' }, { status: 500 });
  }
}
