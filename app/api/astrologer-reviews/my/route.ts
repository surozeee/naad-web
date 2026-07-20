import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';
import type { AstrologerReview } from '@/app/lib/astrologer.types';

const LIST_PATHS = [
  '/user/astrologer/review/my',
  '/user/astrologer-review/my',
  '/user/review/astrologer/my',
];

function unwrapReviews(raw: unknown): AstrologerReview[] {
  if (Array.isArray(raw)) return raw as AstrologerReview[];
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as AstrologerReview[];
    if (Array.isArray(obj.result)) return obj.result as AstrologerReview[];
    if (obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>;
      if (Array.isArray(data.result)) return data.result as AstrologerReview[];
    }
  }
  return [];
}

/** Reviews submitted by the signed-in customer. */
export async function GET(request: NextRequest) {
  try {
    for (const path of LIST_PATHS) {
      const res = await fetch(backendUrl(path), {
        method: 'GET',
        headers: backendHeaders(request),
      });
      if (res.ok) {
        const json = await res.json().catch(() => ({}));
        const reviews = unwrapReviews(json);
        return NextResponse.json({ status: 'SUCCESS', data: reviews }, { status: 200 });
      }
      if (res.status !== 404 && res.status !== 405) {
        const json = await res.json().catch(() => ({}));
        return NextResponse.json(json, { status: res.status });
      }
    }
    return NextResponse.json({ status: 'SUCCESS', data: [] }, { status: 200 });
  } catch (e) {
    console.error('[API astrologer review my]', e);
    return NextResponse.json({ status: 'SUCCESS', data: [] }, { status: 200 });
  }
}
