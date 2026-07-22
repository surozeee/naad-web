import { NextResponse } from 'next/server';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Public active timezones (localized labels via Accept-Language). */
export async function GET(request: Request) {
  try {
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const primary = acceptLanguage.split(',')[0]?.trim().slice(0, 16) || 'en';
    const res = await publicBackendRequest(
      ['/public/master/timezone/list-active', '/master/timezone/list-active'],
      {
        method: 'GET',
        headers: { 'Accept-Language': primary },
      }
    );
    if (!res.ok) {
      // Upstream may not have public timezone yet / table missing — don't hard-fail kundali UI.
      console.warn('[Public] timezone list-active upstream status', res.status);
      return NextResponse.json({ status: 'SUCCESS', data: [], result: [] }, { status: 200 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('[Public] timezone list-active error:', error);
    return NextResponse.json({ status: 'SUCCESS', data: [], result: [] }, { status: 200 });
  }
}
