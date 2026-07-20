import { NextResponse } from 'next/server';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Public active Nepali calendar years (no browser session required). */
export async function GET() {
  try {
    const res = await publicBackendRequest(
      [
        '/public/master/nepali-calendar/list-active',
        '/master/nepali-calendar/list-active',
      ],
      { method: 'GET' }
    );
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ status: 'SUCCESS', data: [], result: [] }, { status: 200 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Public] nepali-calendar list-active error:', error);
    return NextResponse.json({ status: 'SUCCESS', data: [], result: [] }, { status: 200 });
  }
}
