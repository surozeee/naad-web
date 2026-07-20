import { NextResponse } from 'next/server';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

const FALLBACK = {
  status: 'SUCCESS',
  data: [
    { code: 'en', iso: 'en', name: 'English', nativeName: 'English', status: 'ACTIVE' },
    { code: 'ne', iso: 'ne', name: 'Nepali', nativeName: 'नेपाली', status: 'ACTIVE' },
    { code: 'hi', iso: 'hi', name: 'Hindi', nativeName: 'हिन्दी', status: 'ACTIVE' },
  ],
};

/** Active UI languages for public marketing (EN / NE / HI). */
export async function GET(request: Request) {
  try {
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const res = await publicBackendRequest(
      [
        '/public/master/language/list-active',
        '/public/language/list-active',
        '/master/language/list-active',
      ],
      {
        method: 'GET',
        headers: {
          'Accept-Language': acceptLanguage.slice(0, 8),
        },
      }
    );

    if (res.status === 401 || res.status === 403 || !res.ok) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }

    const data = await res.json().catch(() => null);
    const list = Array.isArray((data as { data?: unknown })?.data)
      ? (data as { data: unknown[] }).data
      : Array.isArray(data)
        ? data
        : null;

    if (!list?.length) {
      return NextResponse.json(FALLBACK, { status: 200 });
    }

    return NextResponse.json(data ?? { status: 'SUCCESS', data: list }, { status: 200 });
  } catch (error) {
    console.error('[Public] language list-active error:', error);
    return NextResponse.json(FALLBACK, { status: 200 });
  }
}
