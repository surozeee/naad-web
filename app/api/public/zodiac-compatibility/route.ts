import { NextResponse } from 'next/server';
import { publicBackendRequest } from '@/app/lib/public-backend';

export const dynamic = 'force-dynamic';

/** Public zodiac sign compatibility (no DOB). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const signA = searchParams.get('signA');
    const signB = searchParams.get('signB');
    if (!signA?.trim() || !signB?.trim()) {
      return NextResponse.json(
        { status: 'FAILED', message: 'signA and signB query parameters are required' },
        { status: 400 }
      );
    }

    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const qs = new URLSearchParams({ signA: signA.trim(), signB: signB.trim() }).toString();
    const res = await publicBackendRequest(
      [
        `/public/event/zodiac-compatibility?${qs}`,
        `/mobile/public/zodiac-compatibility?${qs}`,
      ],
      {
        method: 'GET',
        headers: { 'Accept-Language': acceptLanguage.slice(0, 8) },
      }
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[Public] zodiac-compatibility error:', error);
    return NextResponse.json(
      { status: 'FAILED', message: 'Zodiac compatibility unavailable' },
      { status: 503 }
    );
  }
}
