import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Resolve IANA timezone for lat/lng via Google Time Zone API.
 * Uses GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const date = searchParams.get('date')?.trim();

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ status: 'FAILED', message: 'lat and lng are required' }, { status: 400 });
  }

  const key = (
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();

  if (!key) {
    return NextResponse.json(
      { status: 'FAILED', message: 'Google Maps API key not configured' },
      { status: 503 }
    );
  }

  let timestamp = Math.floor(Date.now() / 1000);
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const ms = Date.parse(`${date}T12:00:00Z`);
    if (!Number.isNaN(ms)) timestamp = Math.floor(ms / 1000);
  }

  const url =
    `https://maps.googleapis.com/maps/api/timezone/json` +
    `?location=${encodeURIComponent(`${lat},${lng}`)}` +
    `&timestamp=${timestamp}` +
    `&key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = (await res.json()) as {
      status?: string;
      timeZoneId?: string;
      timeZoneName?: string;
      errorMessage?: string;
    };

    if (data.status !== 'OK' || !data.timeZoneId) {
      return NextResponse.json(
        {
          status: 'FAILED',
          message: data.errorMessage || data.status || 'Timezone lookup failed',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      status: 'OK',
      timezone: data.timeZoneId,
      timeZoneName: data.timeZoneName,
    });
  } catch (error) {
    console.error('[timezone]', error);
    return NextResponse.json({ status: 'FAILED', message: 'Timezone service unavailable' }, { status: 503 });
  }
}
