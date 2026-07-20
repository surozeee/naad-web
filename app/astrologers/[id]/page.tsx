'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, UserCircle } from 'lucide-react';
import Footer from '@/app/components/Footer';
import AstrologerReviewList from '@/app/components/astrologer/AstrologerReviewList';
import {
  AstrologerStarDisplay,
  formatAstrologerRating,
} from '@/app/components/astrologer/AstrologerStarDisplay';
import { useAuthModal } from '@/app/components/AuthModalContext';
import type { AstrologerPublicProfile } from '@/app/lib/astrologer.types';
import {
  bookAstrologerPath,
  intentRedirectPath,
  saveAstrologerIntent,
} from '@/app/lib/astrologer-intent';
import { PUBLIC_ASTROLOGER_REVIEW_LIMIT, publicAstrologerApi } from '@/app/lib/public-astrologer';

function AstrologerAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="naad-astro-detail-photo"
        width={120}
        height={120}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="naad-astro-detail-photo-fallback" aria-hidden>
      <UserCircle size={56} strokeWidth={1.15} />
      <span>{name.slice(0, 1).toUpperCase()}</span>
    </span>
  );
}

export default function AstrologerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '').trim();
  const { status } = useSession();
  const authModal = useAuthModal();
  const isAuthed = status === 'authenticated';

  const [astro, setAstro] = useState<AstrologerPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setAstro(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await publicAstrologerApi.listActive({ pageNo: 0, pageSize: 100 });
      const match = rows.find((r) => r.id === id) ?? null;
      setAstro(match);
    } catch {
      setAstro(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'loading') return;
    void load();
  }, [load, status]);

  const goWithAuth = (action: 'rate' | 'book') => {
    if (!astro) return;
    const intent = { astrologerId: astro.id, action, name: astro.name };
    saveAstrologerIntent(intent);
    const target = intentRedirectPath(intent);
    if (isAuthed) {
      router.push(target);
      return;
    }
    authModal?.openLogin(target);
  };

  return (
    <div className="naad-site naad-horoscope-shell">
      <div className="naad-section-inner naad-astro-detail-page">
        <Link href="/astrologers" className="naad-astro-back">
          <ArrowLeft size={16} />
          All astrologers
        </Link>

        {loading ? (
          <div className="naad-astro-loading">
            <Loader2 className="animate-spin" size={22} />
            <span>Loading profile…</span>
          </div>
        ) : !astro ? (
          <div className="naad-astro-empty">
            <p>Astrologer not found or no longer active.</p>
            <Link href="/astrologers" className="naad-btn-ghost naad-btn-sm">
              Back to list
            </Link>
          </div>
        ) : (
          <article className="naad-astro-detail">
            <header className="naad-astro-detail-hero">
              <div className="naad-astro-detail-avatar">
                <AstrologerAvatar name={astro.name} photoUrl={astro.photoUrl} />
              </div>
              <div className="naad-astro-detail-copy">
                    <p className="naad-astro-detail-eyebrow">Naad practitioner</p>
                <h1>{astro.name}</h1>
                <div className="naad-astro-rating-row">
                  <AstrologerStarDisplay value={astro.averageRating} size={16} />
                  <span className="naad-astro-rating-num">
                    {formatAstrologerRating(astro.averageRating)}
                  </span>
                  <span className="naad-astro-review-count">
                    ({astro.reviewCount ?? 0} review{(astro.reviewCount ?? 0) === 1 ? '' : 's'})
                  </span>
                </div>
                {astro.bio?.trim() ? <p className="naad-astro-detail-bio">{astro.bio.trim()}</p> : null}
                <div className="naad-astro-detail-actions">
                  <button
                    type="button"
                    className="naad-btn-primary naad-btn-sm"
                    onClick={() => goWithAuth('book')}
                  >
                    Book
                  </button>
                  <button
                    type="button"
                    className="naad-btn-ghost naad-btn-sm"
                    onClick={() => goWithAuth('rate')}
                  >
                    Rate
                  </button>
                  {!isAuthed && authModal ? (
                  <button
                    type="button"
                    className="naad-btn-ghost naad-btn-sm"
                    onClick={() => {
                      saveAstrologerIntent({
                        astrologerId: astro.id,
                        action: 'book',
                        name: astro.name,
                      });
                      authModal.openRegister(bookAstrologerPath(astro.id));
                    }}
                  >
                    Register to consult
                  </button>
                  ) : null}
                </div>
              </div>
            </header>

            <section className="naad-astro-detail-panel">
              <h2>Consultation overview</h2>
              <p>
                Schedule a confidential video or audio session for kundali review, muhurta timing, or
                personal guidance. After your appointment, you may leave a rating to support other clients.
              </p>
              <ul className="naad-astro-detail-points">
                <li>Private meeting room with your selected astrologer</li>
                <li>Your selection is preserved through sign-in or registration</li>
                <li>Post-session ratings available from your customer account</li>
              </ul>
            </section>

            {(astro.reviewCount ?? 0) > 0 ? (
              <section className="naad-astro-detail-panel">
                <h2>Latest reviews</h2>
                <AstrologerReviewList
                  reviews={astro.reviews}
                  limit={PUBLIC_ASTROLOGER_REVIEW_LIMIT}
                />
              </section>
            ) : (
              <section className="naad-astro-detail-panel">
                <h2>Reviews</h2>
                <p className="naad-astro-reviews-empty">No customer reviews yet.</p>
                <button
                  type="button"
                  className="naad-btn-ghost naad-btn-sm"
                  onClick={() => goWithAuth('rate')}
                >
                  Be the first to rate
                </button>
              </section>
            )}

            <p className="naad-astro-detail-footnote">
              Prefer the list? <Link href="/astrologers">Browse all astrologers</Link>
            </p>
          </article>
        )}
      </div>
      <Footer />
    </div>
  );
}
