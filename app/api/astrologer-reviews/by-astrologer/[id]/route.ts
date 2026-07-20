import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';
import type { AstrologerReview } from '@/app/lib/astrologer.types';

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

function mapReview(raw: Record<string, unknown>, astrologerId: string): AstrologerReview {
  return {
    id: String(raw.id ?? `review-${Date.now()}`),
    astrologerId: String(raw.astrologerId ?? astrologerId),
    customerId: raw.customerId != null ? String(raw.customerId) : null,
    meetingId: raw.meetingId != null ? String(raw.meetingId) : null,
    customerDisplayName:
      raw.customerDisplayName != null
        ? String(raw.customerDisplayName)
        : raw.customerName != null
          ? String(raw.customerName)
          : 'Customer',
    rating: Number(raw.rating ?? 0),
    comment: raw.comment != null ? String(raw.comment) : null,
    createdAt: raw.createdAt != null ? String(raw.createdAt) : null,
  };
}

/**
 * Authenticated: fetch reviews for one astrologer (customer-facing previews).
 * Backend: POST /api/v2/user/astrologer/review/list
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const astrologerId = String(id ?? '').trim();
    if (!astrologerId) {
      return NextResponse.json({ status: 'SUCCESS', data: [] }, { status: 200 });
    }

    const res = await fetch(backendUrl('/user/astrologer/review/list'), {
      method: 'POST',
      headers: backendHeaders(request),
      body: JSON.stringify({
        pageNo: 0,
        pageSize: 100,
        status: 'ACTIVE',
        astrologerId,
      }),
    });

    const json = await res.json().catch(() => ({}));
    const rawReviews = unwrapReviews(json);
    const mapped = rawReviews
      .filter((r) => String((r as unknown as Record<string, unknown>).astrologerId ?? astrologerId) === astrologerId)
      .map((r) => mapReview(r as unknown as Record<string, unknown>, astrologerId));

    return NextResponse.json(
      { status: 'SUCCESS', data: mapped },
      { status: res.ok ? 200 : 200 }
    );
  } catch (e) {
    console.error('[API] astrologer reviews by astrologer error:', e);
    return NextResponse.json({ status: 'SUCCESS', data: [] }, { status: 200 });
  }
}

