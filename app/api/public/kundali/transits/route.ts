import { NextResponse } from 'next/server';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Proxy Swiss Ephemeris planetary transits / gochara to backend public API. */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const acceptLanguage = request.headers.get('accept-language') || 'en';

    const res = await publicBackendRequest(
      ['/public/event/kundali/transits', '/mobile/public/kundali/transits'],
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Accept-Language': acceptLanguage.slice(0, 8),
        },
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Public] kundali transits error:', error);
    return NextResponse.json(
      { status: 'FAILED', message: 'Transit calculation unavailable' },
      { status: 503 }
    );
  }
}
