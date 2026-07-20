'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { AstrologerReview } from '@/app/lib/astrologer.types';
import { PUBLIC_ASTROLOGER_REVIEW_LIMIT, publicAstrologerApi } from '@/app/lib/public-astrologer';
import { astrologerReviewApi } from '@/app/lib/astrologer-review.service';
import { AstrologerStarDisplay, formatAstrologerRating } from './AstrologerStarDisplay';

function formatReviewDate(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AstrologerReviewList({
  astrologerId,
  reviews: reviewsProp,
  compact = false,
  limit = PUBLIC_ASTROLOGER_REVIEW_LIMIT,
  mode = 'public',
}: {
  astrologerId?: string;
  reviews?: AstrologerReview[];
  compact?: boolean;
  limit?: number;
  mode?: 'public' | 'auth';
}) {
  const [reviews, setReviews] = useState<AstrologerReview[]>(reviewsProp ?? []);
  const [loading, setLoading] = useState(reviewsProp == null);

  useEffect(() => {
    if (reviewsProp != null) {
      setReviews(reviewsProp);
      setLoading(false);
      return;
    }

    if (!astrologerId) {
      setReviews([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        if (mode === 'auth') {
          const rows = await astrologerReviewApi.listByAstrologer(astrologerId);
          if (cancelled) return;
          setReviews(rows.slice(0, limit));
        } else {
          const rows = await publicAstrologerApi.listReviews(astrologerId, limit);
          if (cancelled) return;
          setReviews(rows);
        }
      } catch {
        if (!cancelled) setReviews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [astrologerId, reviewsProp, limit, mode]);

  const visible = useMemo(() => {
    const sorted = [...reviews].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    const max = compact ? Math.min(2, limit) : limit;
    return sorted.slice(0, max);
  }, [reviews, compact, limit]);

  if (loading) {
    return (
      <div className="naad-astro-reviews-loading">
        <Loader2 className="animate-spin" size={16} />
        <span>Loading reviews…</span>
      </div>
    );
  }

  if (!visible.length) {
    return <p className="naad-astro-reviews-empty">No customer reviews yet.</p>;
  }

  return (
    <div className="naad-astro-reviews">
      <ul className="naad-astro-review-list">
        {visible.map((review) => (
          <li key={review.id} className="naad-astro-review-item">
            <div className="naad-astro-review-head">
              <strong>{review.customerDisplayName?.trim() || 'Customer'}</strong>
              <span className="naad-astro-review-meta">
                <AstrologerStarDisplay value={review.rating} size={12} />
                <span>{formatAstrologerRating(review.rating)}</span>
                {review.createdAt ? <time>{formatReviewDate(review.createdAt)}</time> : null}
              </span>
            </div>
            {review.comment?.trim() ? <p>{review.comment.trim()}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
