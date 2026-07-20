/**
 * Public astrologer directory helpers.
 * Loads active astrologers from DB via public BFF (session bearer when available).
 */
import {
  computeReviewStats,
  PUBLIC_ASTROLOGER_REVIEW_LIMIT,
  takeLatestReviews,
} from '@/app/lib/astrologer-review-seed';
import { getStoredUiLanguage } from '@/app/lib/ui-language';
import { getXsrfToken } from '@/app/lib/get-xsrf';
import { getCachedSession } from '@/app/lib/auth-fetch';
import { mapUserToPublicAstrologer } from '@/app/lib/astrologer-public-map';
import { userApi } from '@/app/lib/user-api.service';
import { astrologerReviewApi } from '@/app/lib/astrologer-review.service';
import type {
  AstrologerListRequest,
  AstrologerPublicProfile,
  AstrologerReview,
} from '@/app/lib/astrologer.types';

export { PUBLIC_ASTROLOGER_REVIEW_LIMIT };

async function publicFetch(input: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', getStoredUiLanguage());
  }
  const xsrf = getXsrfToken();
  if (xsrf) headers.set('X-XSRF-TOKEN', xsrf);

  if (!headers.has('Authorization')) {
    try {
      const session = (await getCachedSession()) as { access_token?: string } | null;
      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`);
      }
    } catch {
      /* anonymous */
    }
  }

  return fetch(input, { ...init, credentials: 'same-origin', headers });
}

function unwrapProfiles(json: unknown): AstrologerPublicProfile[] {
  if (Array.isArray(json)) return json as AstrologerPublicProfile[];
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as AstrologerPublicProfile[];
    if (Array.isArray(obj.result)) return obj.result as AstrologerPublicProfile[];
    if (obj.data && typeof obj.data === 'object') {
      const data = obj.data as Record<string, unknown>;
      if (Array.isArray(data.result)) return data.result as AstrologerPublicProfile[];
      if (Array.isArray(data.content)) return data.content as AstrologerPublicProfile[];
      if (Array.isArray(data.data)) return data.data as AstrologerPublicProfile[];
    }
  }
  return [];
}

function unwrapReviews(json: unknown): AstrologerReview[] {
  if (Array.isArray(json)) return json as AstrologerReview[];
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>;
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

async function listActiveFromAuthenticatedApi(
  body: AstrologerListRequest
): Promise<AstrologerPublicProfile[]> {
  try {
    const { rows } = await userApi.listAstrologersPaginated({
      pageNo: body.pageNo ?? 0,
      pageSize: body.pageSize ?? 50,
      search: body.search,
      sortBy: body.sortBy ?? 'name',
      sortDirection: body.sortDirection ?? 'asc',
    });

    const profiles = (rows ?? [])
      .map(mapUserToPublicAstrologer)
      .filter((x): x is AstrologerPublicProfile => Boolean(x));

    return Promise.all(
      profiles.map(async (profile) => {
        let reviews: AstrologerReview[] = [];
        try {
          reviews = await astrologerReviewApi.listByAstrologer(profile.id);
        } catch {
          reviews = [];
        }
        const stats = computeReviewStats(reviews);
        return {
          ...profile,
          averageRating: stats.averageRating,
          reviewCount: stats.reviewCount,
          reviews: takeLatestReviews(reviews, PUBLIC_ASTROLOGER_REVIEW_LIMIT),
          reviewsFromSeed: false,
        };
      })
    );
  } catch {
    return [];
  }
}

export const publicAstrologerApi = {
  /** Active astrologers from DB + rating + last 5 DB reviews. */
  listActive: async (body: AstrologerListRequest = {}): Promise<AstrologerPublicProfile[]> => {
    try {
      const res = await publicFetch('/api/public/astrologer/list-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageNo: 0,
          pageSize: 50,
          sortBy: 'name',
          sortDirection: 'asc',
          ...body,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const fromPublic = res.ok ? unwrapProfiles(json) : [];
      if (fromPublic.length) return fromPublic;
    } catch {
      /* fall through */
    }

    return listActiveFromAuthenticatedApi(body);
  },

  list: async (body: AstrologerListRequest = {}): Promise<AstrologerPublicProfile[]> => {
    return publicAstrologerApi.listActive(body);
  },

  listReviews: async (
    astrologerId: string,
    limit = PUBLIC_ASTROLOGER_REVIEW_LIMIT
  ): Promise<AstrologerReview[]> => {
    const res = await publicFetch(
      `/api/public/astrologer/${encodeURIComponent(astrologerId)}/reviews?limit=${limit}`,
      { method: 'GET' }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return unwrapReviews(json);
  },
};
