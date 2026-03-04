import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';

/** GET menu tree - proxy to User-Service MenuController (root-tree). */
export async function GET(request: NextRequest) {
  try {
    const path = request.nextUrl.searchParams.get('tree') !== null ? '/user/menu/root-tree' : '/user/menu/list';
    const search = path.includes('list') ? (request.nextUrl?.search?.toString() || '') : '';
    const url = backendUrl(path) + search;
    const res = await fetch(url, {
      method: 'GET',
      headers: backendHeaders(request),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API menus]', e);
    return NextResponse.json({ message: 'Failed to fetch menus' }, { status: 500 });
  }
}

/** POST menu list (paginated) - proxy to User-Service menu/list-paginate. Body: { pageNo, pageSize, sortBy?, sortDirection?, search? }. */
export async function POST(request: NextRequest) {
  try {
    const url = backendUrl('/user/menu/list-paginate');
    const body = await request.json().catch(() => ({}));
    const payload = {
      pageNo: body.pageNo ?? 0,
      pageSize: body.pageSize ?? 10,
      ...(body.sortBy != null && { sortBy: body.sortBy }),
      ...(body.sortDirection != null && { sortDirection: body.sortDirection }),
      ...(body.search != null && body.search !== '' && { search: body.search }),
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API menus POST]', e);
    return NextResponse.json({ message: 'Failed to fetch menus' }, { status: 500 });
  }
}
