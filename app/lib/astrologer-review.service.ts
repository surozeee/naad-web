import { fetchWithAuth } from '@/app/lib/auth-fetch';
import type { AstrologerReview, AstrologerReviewCreateRequest } from '@/app/lib/astrologer.types';

function unwrapReviews(json: unknown): AstrologerReview[] {
  if (Array.isArray(json)) return json as AstrologerReview[];
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as AstrologerReview[];
    if (Array.isArray(obj.result)) return obj.result as AstrologerReview[];
  }
  return [];
}

export const astrologerReviewApi = {
  create: async (body: AstrologerReviewCreateRequest): Promise<AstrologerReview> => {
    const res = await fetchWithAuth('/api/astrologer-reviews/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(
        (json as { message?: string }).message || `Failed to submit review (${res.status})`
      );
    }
    const data = (json as { data?: AstrologerReview }).data;
    if (!data) throw new Error('Invalid review response');
    return data;
  },

  listMine: async (): Promise<AstrologerReview[]> => {
    const res = await fetchWithAuth('/api/astrologer-reviews/my', { method: 'GET' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return unwrapReviews(json);
  },

  listByAstrologer: async (astrologerId: string): Promise<AstrologerReview[]> => {
    const res = await fetchWithAuth(`/api/astrologer-reviews/by-astrologer/${encodeURIComponent(astrologerId)}`, {
      method: 'GET',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return unwrapReviews(json);
  },
};
