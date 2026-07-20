import { NextRequest, NextResponse } from 'next/server';
import { backendHeadersFromSession, backendUrl } from '@/app/lib/backend-api';

/** Backend: POST /api/v2/user/astrologer/list (AstrologerResourceController) */
const LIST_PATH = '/user/astrologer/list';
const LIST_ACTIVE_PATH = '/user/astrologer/list-active';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const headers = await backendHeadersFromSession(request);
    const payload = paginatePayload(body);

    // Prefer list-active when present; fall back to full list (admin page).
    let res = await fetch(backendUrl(LIST_ACTIVE_PATH), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (res.status === 404 || res.status === 405) {
      res = await fetch(backendUrl(LIST_PATH), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error('[API astrologer list]', e);
    return NextResponse.json({ message: 'Failed to fetch astrologers' }, { status: 500 });
  }
}
