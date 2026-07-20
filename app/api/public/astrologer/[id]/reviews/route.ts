import { NextResponse } from 'next/server';
import {
  computeReviewStats,
  PUBLIC_ASTROLOGER_REVIEW_LIMIT,
  takeLatestReviews,
} from '@/app/lib/astrologer-review-seed';
import {
  backendHeadersFromSession,
  backendUrl,
  resolveAccessTokenFromRequest,
} from '@/app/lib/backend-api';
import { backendFetch } from '@/app/lib/api-base';
import { publicBackendRequest } from '@/app/lib/public-backend';
import type { AstrologerReview } from '@/app/lib/astrologer.types';

export const dynamic = 'force-dynamic';

function unwrapReviews(raw: unknown): AstrologerReview[] {
  if (Array.isArray(raw)) return raw as AstrologerReview[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as AstrologerReview[];
    if (Array.isArray(obj.result)) return obj.result as AstrologerReview[];
    if (obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>;
      if (Array.isArray(data.result)) return data.result as AstrologerReview[];
      if (Array.isArray(data.content)) return data.content as AstrologerReview[];
    }
  }
  return [];
}

/** Public reviews for one astrologer — latest 5 from DB only (no sample seed). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: astrologerId } = await context.params;
  const acceptLanguage = request.headers.get('accept-language') || 'en';
  const url = new URL(request.url);
  const limitRaw = Number(url.searchParams.get('limit') ?? PUBLIC_ASTROLOGER_REVIEW_LIMIT);
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(limitRaw, 20)
      : PUBLIC_ASTROLOGER_REVIEW_LIMIT;

  const body = {
    astrologerId,
    pageNo: 0,
    pageSize: 50,
    status: 'ACTIVE',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  };

  try {
    let allReviews: AstrologerReview[] = [];

    const accessToken = await resolveAccessTokenFromRequest(request);
    if (accessToken) {
      const headers = await backendHeadersFromSession(request);
      headers['Accept-Language'] = acceptLanguage.slice(0, 8);
      const res = await backendFetch(backendUrl('/user/astrologer/review/list'), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        allReviews = unwrapReviews(json).filter((r) => String(r.astrologerId) === astrologerId);
      }
    }

    if (!allReviews.length) {
      const res = await publicBackendRequest(
        [
          `/public/user/astrologer/${encodeURIComponent(astrologerId)}/reviews`,
          `/public/astrologer/${encodeURIComponent(astrologerId)}/reviews`,
          '/public/user/astrologer/review/list',
          '/user/astrologer/review/list',
        ],
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Accept-Language': acceptLanguage.slice(0, 8) },
        }
      );
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        allReviews = unwrapReviews(json).filter((r) => String(r.astrologerId) === astrologerId);
      }
    }

    const stats = computeReviewStats(allReviews);
    const reviews = takeLatestReviews(allReviews, limit);

    return NextResponse.json(
      {
        status: 'SUCCESS',
        data: reviews,
        fromSeed: false,
        ...stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Public] astrologer reviews error:', error);
    return NextResponse.json(
      {
        status: 'SUCCESS',
        data: [],
        fromSeed: false,
        averageRating: null,
        reviewCount: 0,
      },
      { status: 200 }
    );
  }
}
