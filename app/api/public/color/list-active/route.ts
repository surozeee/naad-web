import { NextResponse } from 'next/server';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Public active colors (no browser session required). */
export async function GET(request: Request) {
  try {
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const res = await publicBackendRequest(
      ['/public/master/color/list-active', '/master/color/list-active'],
      {
        method: 'GET',
        headers: { 'Accept-Language': acceptLanguage.slice(0, 8) },
      }
    );
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ status: 'SUCCESS', data: [], result: [] }, { status: 200 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Public] color list-active error:', error);
    return NextResponse.json({ status: 'SUCCESS', data: [], result: [] }, { status: 200 });
  }
}
