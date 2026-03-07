import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** Optional: set in env to proxy customer list to backend, e.g. NEXT_PUBLIC_CUSTOMER_API_PATH=/customer/list */
const CUSTOMER_LIST_PATH = process.env.NEXT_PUBLIC_CUSTOMER_API_PATH || '';

function paginatePayload(body: unknown) {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  return {
    pageNo: b.pageNo ?? 0,
    pageSize: b.pageSize ?? 1000,
    ...(b.sortBy != null && { sortBy: b.sortBy }),
    ...(b.sortDirection != null && { sortDirection: b.sortDirection }),
    ...(b.search != null && b.search !== '' && { search: b.search }),
  };
}

/** POST list customers. Returns empty list when no backend is configured; otherwise proxies to backend. */
export async function POST(request: NextRequest) {
  try {
    if (!CUSTOMER_LIST_PATH) {
      return NextResponse.json({
        data: { result: [] },
        message: 'OK',
      });
    }
    const body = await request.json().catch(() => ({}));
    const payload = paginatePayload(body);
    const url = backendUrl(CUSTOMER_LIST_PATH);
    const res = await fetch(url, {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API customers]', e);
    return NextResponse.json({ message: 'Failed to fetch customers', data: { result: [] } }, { status: 500 });
  }
}
