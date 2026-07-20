import type { AstrologerReview } from '@/app/lib/astrologer.types';

/** Demo reviews shown when backend has no review rows yet. */
export const ASTROLOGER_REVIEW_SEEDS: AstrologerReview[] = [
  {
    id: 'seed-1',
    astrologerId: '*',
    customerDisplayName: 'Anita K.',
    rating: 5,
    comment: 'Very clear guidance on career timing. Felt heard and understood.',
    createdAt: '2026-03-12T10:00:00Z',
  },
  {
    id: 'seed-2',
    astrologerId: '*',
    customerDisplayName: 'Ramesh P.',
    rating: 4.5,
    comment: 'Detailed kundali reading with practical advice for family matters.',
    createdAt: '2026-03-05T14:30:00Z',
  },
  {
    id: 'seed-3',
    astrologerId: '*',
    customerDisplayName: 'Sunita M.',
    rating: 5,
    comment: 'Warm, patient, and accurate. Will consult again before major decisions.',
    createdAt: '2026-02-20T09:15:00Z',
  },
  {
    id: 'seed-4',
    astrologerId: '*',
    customerDisplayName: 'David L.',
    rating: 4,
    comment: 'Helpful session on relationship compatibility. Easy to follow.',
    createdAt: '2026-02-08T16:45:00Z',
  },
];

export function getSeedReviewsForAstrologer(astrologerId: string): AstrologerReview[] {
  return ASTROLOGER_REVIEW_SEEDS.map((row) => ({
    ...row,
    id: `${row.id}-${astrologerId}`,
    astrologerId,
  }));
}

export function computeReviewStats(reviews: AstrologerReview[]): {
  averageRating: number | null;
  reviewCount: number;
} {
  if (!reviews.length) return { averageRating: null, reviewCount: 0 };
  const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
  const avg = sum / reviews.length;
  return {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  };
}

export const PUBLIC_ASTROLOGER_REVIEW_LIMIT = 5;

export function sortReviewsNewest(reviews: AstrologerReview[]): AstrologerReview[] {
  return [...reviews].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}

export function takeLatestReviews(
  reviews: AstrologerReview[],
  limit = PUBLIC_ASTROLOGER_REVIEW_LIMIT
): AstrologerReview[] {
  return sortReviewsNewest(reviews).slice(0, limit);
}
