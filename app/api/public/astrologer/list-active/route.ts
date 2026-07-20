import { NextResponse } from 'next/server';
import { loadPublicActiveAstrologersWithReviews } from '@/app/lib/astrologer-public-server';

export const dynamic = 'force-dynamic';

/**
 * Public active-astrologer API for /astrologers.
 * Backend: POST /api/v2/user/astrologer/list-active (same source as admin).
 * Auth: visitor session cookie and/or PUBLIC_API_BEARER.
 * Response: public fields only + averageRating + last 5 reviews.
 */
export async function GET(request: Request) {
  try {
    const acceptLanguage = request.headers.get('accept-language') || 'en';
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim() || undefined;

    const data = await loadPublicActiveAstrologersWithReviews({
      request,
      acceptLanguage,
      search,
      pageNo: 0,
      pageSize: 50,
    });

    return NextResponse.json(
      {
        status: 'SUCCESS',
        data,
        totalElements: data.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Public] astrologer list-active error:', error);
    return NextResponse.json({ status: 'SUCCESS', data: [], totalElements: 0 }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const acceptLanguage = request.headers.get('accept-language') || 'en';

    const data = await loadPublicActiveAstrologersWithReviews({
      request,
      acceptLanguage,
      search: typeof body.search === 'string' ? body.search.trim() || undefined : undefined,
      pageNo: typeof body.pageNo === 'number' ? body.pageNo : 0,
      pageSize: typeof body.pageSize === 'number' ? body.pageSize : 50,
    });

    return NextResponse.json(
      {
        status: 'SUCCESS',
        data,
        totalElements: data.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Public] astrologer list-active error:', error);
    return NextResponse.json({ status: 'SUCCESS', data: [], totalElements: 0 }, { status: 200 });
  }
}
