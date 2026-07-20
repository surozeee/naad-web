import { NextResponse } from 'next/server';
import { loadPublicActiveAstrologersWithReviews } from '@/app/lib/astrologer-public-server';

export const dynamic = 'force-dynamic';

/** @deprecated Prefer GET/POST /api/public/astrologer/list-active */
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
    console.error('[Public] astrologer list error:', error);
    return NextResponse.json({ status: 'SUCCESS', data: [], totalElements: 0 }, { status: 200 });
  }
}
