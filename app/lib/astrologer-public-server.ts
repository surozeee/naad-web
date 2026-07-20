import {
  computeReviewStats,
  PUBLIC_ASTROLOGER_REVIEW_LIMIT,
  sortReviewsNewest,
  takeLatestReviews,
} from '@/app/lib/astrologer-review-seed';
import { sanitizeAstrologerListPayload } from '@/app/lib/astrologer-public-map';
import {
  backendHeadersFromSession,
  backendUrl,
  resolveAccessTokenFromRequest,
} from '@/app/lib/backend-api';
import { backendFetch } from '@/app/lib/api-base';
import { publicBackendHeaders, publicBackendRequest } from '@/app/lib/public-backend';
import type { AstrologerPublicProfile, AstrologerReview } from '@/app/lib/astrologer.types';

export { PUBLIC_ASTROLOGER_REVIEW_LIMIT, sortReviewsNewest, takeLatestReviews };

const LIST_CANDIDATES = [
  '/user/astrologer/list-active',
  '/user/astrologer/list',
  '/public/user/astrologer/list-active',
  '/public/astrologer/list-active',
];

const REVIEW_CANDIDATES = [
  '/user/astrologer/review/list',
  '/public/user/astrologer/review/list',
  '/public/astrologer/review/list',
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
      if (Array.isArray(data.content)) return data.content as AstrologerReview[];
    }
  }
  return [];
}

function mapReviewRow(raw: Record<string, unknown>, astrologerId: string): AstrologerReview {
  return {
    id: String(raw.id ?? `review-${astrologerId}-${Date.now()}`),
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

function listPayload(options: {
  search?: string;
  pageNo?: number;
  pageSize?: number;
}): Record<string, unknown> {
  return {
    pageNo: options.pageNo ?? 0,
    pageSize: options.pageSize ?? 50,
    sortBy: 'name',
    sortDirection: 'asc',
    status: 'ACTIVE',
    ...(options.search ? { search: options.search } : {}),
  };
}

async function fetchWithAuthHeaders(
  path: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): Promise<Response | null> {
  try {
    return await backendFetch(backendUrl(path), {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch {
    return null;
  }
}

/**
 * Load active astrologers using (in order):
 * 1) visitor session token (same as admin list when logged in)
 * 2) PUBLIC_API_BEARER / public backend paths
 */
export async function fetchPublicActiveAstrologers(options: {
  request?: Request;
  acceptLanguage?: string;
  search?: string;
  pageNo?: number;
  pageSize?: number;
}): Promise<AstrologerPublicProfile[]> {
  const payload = listPayload(options);
  const acceptLanguage = options.acceptLanguage?.slice(0, 8);

  // 1) Session / cookie bearer (logged-in visitor or admin)
  if (options.request) {
    const accessToken = await resolveAccessTokenFromRequest(options.request);
    if (accessToken) {
      const headers = await backendHeadersFromSession(options.request);
      if (acceptLanguage) headers['Accept-Language'] = acceptLanguage;

      for (const path of ['/user/astrologer/list-active', '/user/astrologer/list']) {
        const res = await fetchWithAuthHeaders(path, headers, payload);
        if (!res) continue;
        if (res.ok) {
          const json = await res.json().catch(() => ({}));
          const profiles = sanitizeAstrologerListPayload(json);
          if (profiles.length) return profiles;
        }
      }
    }
  }

  // 2) Public / service bearer (anonymous marketing reads)
  const publicHeaders: Record<string, string> = {
    ...publicBackendHeaders({ json: true }),
    ...(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}),
  };

  for (const path of LIST_CANDIDATES) {
    const res = await fetchWithAuthHeaders(path, publicHeaders, payload);
    if (!res) continue;
    if (res.status === 401 || res.status === 403) continue;
    if (!res.ok) continue;
    const json = await res.json().catch(() => ({}));
    const profiles = sanitizeAstrologerListPayload(json);
    if (profiles.length) return profiles;
  }

  // 3) Last resort via shared public helper
  const fallback = await publicBackendRequest(LIST_CANDIDATES, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: acceptLanguage ? { 'Accept-Language': acceptLanguage } : undefined,
  });

  if (fallback.status === 401 || fallback.status === 403) {
    console.warn(
      '[Public] astrologer list-active: backend requires auth. Sign in, or set PUBLIC_API_BEARER so anonymous visitors can load active astrologers.'
    );
    return [];
  }

  if (!fallback.ok) return [];
  const json = await fallback.json().catch(() => ({}));
  return sanitizeAstrologerListPayload(json);
}

export async function fetchPublicAstrologerReviews(options?: {
  request?: Request;
}): Promise<AstrologerReview[]> {
  const body = {
    pageNo: 0,
    pageSize: 500,
    status: 'ACTIVE',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  };

  if (options?.request) {
    const accessToken = await resolveAccessTokenFromRequest(options.request);
    if (accessToken) {
      const headers = await backendHeadersFromSession(options.request);
      for (const path of REVIEW_CANDIDATES) {
        const res = await fetchWithAuthHeaders(path, headers, body);
        if (!res?.ok) continue;
        const json = await res.json().catch(() => ({}));
        const rows = unwrapReviews(json);
        if (rows.length) {
          return rows.map((row) =>
            mapReviewRow(row as unknown as Record<string, unknown>, String(row.astrologerId ?? ''))
          );
        }
      }
    }
  }

  const res = await publicBackendRequest(REVIEW_CANDIDATES, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const json = await res.json().catch(() => ({}));
  return unwrapReviews(json).map((row) =>
    mapReviewRow(row as unknown as Record<string, unknown>, String(row.astrologerId ?? ''))
  );
}

export function enrichAstrologersWithReviews(
  profiles: AstrologerPublicProfile[],
  allReviews: AstrologerReview[],
  reviewLimit = PUBLIC_ASTROLOGER_REVIEW_LIMIT
): AstrologerPublicProfile[] {
  return profiles.map((profile) => {
    const forAstrologer = allReviews.filter((r) => String(r.astrologerId) === profile.id);
    const stats = computeReviewStats(forAstrologer);
    const reviews = takeLatestReviews(forAstrologer, reviewLimit);

    return {
      ...profile,
      averageRating: stats.averageRating,
      reviewCount: stats.reviewCount,
      reviews,
      reviewsFromSeed: false,
    };
  });
}

export async function loadPublicActiveAstrologersWithReviews(options: {
  request?: Request;
  acceptLanguage?: string;
  search?: string;
  pageNo?: number;
  pageSize?: number;
  reviewLimit?: number;
}): Promise<AstrologerPublicProfile[]> {
  const [profiles, allReviews] = await Promise.all([
    fetchPublicActiveAstrologers(options),
    fetchPublicAstrologerReviews({ request: options.request }),
  ]);

  return enrichAstrologersWithReviews(profiles, allReviews, options.reviewLimit);
}
