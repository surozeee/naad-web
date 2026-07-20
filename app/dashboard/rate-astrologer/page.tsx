'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import DashboardLayout from '@/app/components/DashboardLayout';
import AstrologerRatingForm from '@/app/components/astrologer/AstrologerRatingForm';
import {
  AstrologerStarDisplay,
  formatAstrologerRating,
} from '@/app/components/astrologer/AstrologerStarDisplay';
import { astrologerReviewApi } from '@/app/lib/astrologer-review.service';
import type { AstrologerPublicProfile, AstrologerReview } from '@/app/lib/astrologer.types';
import { publicAstrologerApi } from '@/app/lib/public-astrologer';

function RateAstrologerContent() {
  const searchParams = useSearchParams();
  const preselectId = searchParams.get('astrologerId')?.trim() ?? '';

  const [astrologers, setAstrologers] = useState<AstrologerPublicProfile[]>([]);
  const [myReviews, setMyReviews] = useState<AstrologerReview[]>([]);
  const [selectedId, setSelectedId] = useState(preselectId);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, mine] = await Promise.all([
        publicAstrologerApi.listActive({ pageNo: 0, pageSize: 100 }),
        astrologerReviewApi.listMine(),
      ]);

      setAstrologers(list);
      setMyReviews(mine);
      setSelectedId((current) => {
        if (preselectId && list.some((a) => a.id === preselectId)) return preselectId;
        if (current && list.some((a) => a.id === current)) return current;
        return list[0]?.id ?? '';
      });
    } catch {
      setAstrologers([]);
    } finally {
      setLoading(false);
    }
  }, [preselectId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selected = useMemo(
    () => astrologers.find((a) => a.id === selectedId) ?? null,
    [astrologers, selectedId]
  );

  const alreadyReviewed = useMemo(
    () => new Set(myReviews.map((r) => String(r.astrologerId))),
    [myReviews]
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Rate an astrologer</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Share your experience after a session. Your rating helps other customers choose with
            confidence.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            <Link href="/astrologers" className="text-purple-600 dark:text-purple-400 hover:underline">
              View all astrologers →
            </Link>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 py-8">
            <Loader2 className="animate-spin" size={20} />
            Loading…
          </div>
        ) : astrologers.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <p className="text-gray-600 dark:text-gray-400">No astrologers available to rate yet.</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
              <label className="block space-y-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-white">Astrologer</span>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-white px-3 py-2"
                >
                  {astrologers.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {alreadyReviewed.has(a.id) ? ' (reviewed)' : ''}
                    </option>
                  ))}
                </select>
              </label>

              {selected ? (
                <div className="flex items-center gap-3 pt-1">
                  <AstrologerStarDisplay value={selected.averageRating} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatAstrologerRating(selected.averageRating)} · {selected.reviewCount ?? 0}{' '}
                    reviews
                  </span>
                </div>
              ) : null}
            </div>

            {selected ? (
              alreadyReviewed.has(selected.id) ? (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-6">
                  <p className="text-amber-900 dark:text-amber-200">
                    You have already submitted a review for {selected.name}. Thank you for your
                    feedback.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                    Review {selected.name}
                  </h2>
                  <AstrologerRatingForm
                    astrologerId={selected.id}
                    astrologerName={selected.name}
                    onSubmitted={() => void loadData()}
                  />
                </div>
              )
            ) : null}

            {myReviews.length > 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  Your submitted reviews
                </h2>
                <ul className="space-y-3">
                  {myReviews.map((review) => {
                    const name =
                      astrologers.find((a) => a.id === review.astrologerId)?.name ?? 'Astrologer';
                    return (
                      <li
                        key={review.id}
                        className="rounded-lg border border-gray-100 dark:border-slate-700 p-4"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <strong className="text-gray-800 dark:text-white">{name}</strong>
                          <AstrologerStarDisplay value={review.rating} size={12} />
                        </div>
                        {review.comment?.trim() ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function RateAstrologerPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex items-center justify-center py-16 text-gray-500">Loading…</div>
        </DashboardLayout>
      }
    >
      <RateAstrologerContent />
    </Suspense>
  );
}
