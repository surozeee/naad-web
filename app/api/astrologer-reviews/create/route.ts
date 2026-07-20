import { NextRequest, NextResponse } from 'next/server';
import { backendHeaders, backendUrl } from '@/app/lib/backend-api';
import type { AstrologerReview, AstrologerReviewCreateRequest } from '@/app/lib/astrologer.types';

const CREATE_PATHS = [
  '/user/astrologer/review/create',
  '/user/astrologer-review/create',
  '/user/review/astrologer/create',
];

function validateBody(body: AstrologerReviewCreateRequest): string | null {
  if (!body.astrologerId?.trim()) return 'Astrologer is required';
  const rating = Number(body.rating);
  if (!Number.isFinite(rating) || rating < 0.5 || rating > 5) {
    return 'Rating must be between 0.5 and 5';
  }
  if (Math.round(rating * 2) !== rating * 2) {
    return 'Rating must use 0.5 steps';
  }
  return null;
}

function mapReview(raw: Record<string, unknown>): AstrologerReview {
  return {
    id: String(raw.id ?? `local-${Date.now()}`),
    astrologerId: String(raw.astrologerId ?? ''),
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
    createdAt: raw.createdAt != null ? String(raw.createdAt) : new Date().toISOString(),
  };
}

/** Authenticated customer submits an astrologer review. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as AstrologerReviewCreateRequest;
    const error = validateBody(body);
    if (error) {
      return NextResponse.json({ message: error }, { status: 400 });
    }

    const payload = {
      astrologerId: body.astrologerId.trim(),
      rating: Number(body.rating),
      comment: body.comment?.trim() || undefined,
      meetingId: body.meetingId?.trim() || undefined,
    };

    let lastStatus = 503;
    let lastJson: Record<string, unknown> = { message: 'Review service unavailable' };

    for (const path of CREATE_PATHS) {
      const res = await fetch(backendUrl(path), {
        method: 'POST',
        headers: backendHeaders(request),
        body: JSON.stringify(payload),
      });
      lastStatus = res.status;
      lastJson = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (res.ok) {
        const dataRaw = (lastJson.data ?? lastJson) as Record<string, unknown>;
        const review = mapReview(
          typeof dataRaw === 'object' && dataRaw ? dataRaw : { ...payload, id: `review-${Date.now()}` }
        );
        return NextResponse.json({ status: 'SUCCESS', data: review }, { status: 200 });
      }
      if (res.status !== 404 && res.status !== 405) break;
    }

    return NextResponse.json(
      {
        message:
          typeof lastJson.message === 'string'
            ? lastJson.message
            : 'Could not save review. Ask your admin to enable astrologer reviews on the backend.',
      },
      { status: lastStatus >= 400 ? lastStatus : 503 }
    );
  } catch (e) {
    console.error('[API astrologer review create]', e);
    return NextResponse.json({ message: 'Failed to submit review' }, { status: 500 });
  }
}
