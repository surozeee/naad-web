import { NextResponse } from 'next/server';
import {
  emptyPublishedListPayload,
  publicBackendRequest,
} from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Public published-only horoscope list (no browser session required). */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const payload = {
      ...body,
      publishStatus: 'PUBLISHED',
      status: 'ACTIVE',
      pageNo: typeof body.pageNo === 'number' ? body.pageNo : 0,
      pageSize: typeof body.pageSize === 'number' ? body.pageSize : 50,
      sortBy: typeof body.sortBy === 'string' ? body.sortBy : 'zodiacSign',
      sortDirection: typeof body.sortDirection === 'string' ? body.sortDirection : 'asc',
    };

    const res = await publicBackendRequest(
      [
        '/public/event/horoscope/list',
        '/public/horoscope/list',
        '/event/horoscope/list',
      ],
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Accept-Language': acceptLanguage.slice(0, 8),
        },
      }
    );

    // Backend still requires login and no PUBLIC_API_BEARER — return empty list (not a login modal).
    if (res.status === 401 || res.status === 403) {
      console.warn(
        '[Public] horoscope list: backend requires auth. Set PUBLIC_API_BEARER or expose a public list API.'
      );
      return NextResponse.json(emptyPublishedListPayload(), { status: 200 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Public] horoscope list error:', error);
    return NextResponse.json(emptyPublishedListPayload(), { status: 200 });
  }
}
