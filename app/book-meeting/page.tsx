'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, UserCircle } from 'lucide-react';
import Footer from '@/app/components/Footer';
import {
  AstrologerStarDisplay,
  formatAstrologerRating,
} from '@/app/components/astrologer/AstrologerStarDisplay';
import { useAuthModal } from '@/app/components/AuthModalContext';
import type { AstrologerPublicProfile } from '@/app/lib/astrologer.types';
import {
  astrologerDetailPath,
  bookAstrologerPath,
  clearAstrologerIntent,
  readAstrologerIntent,
  saveAstrologerIntent,
} from '@/app/lib/astrologer-intent';
import { publicAstrologerApi } from '@/app/lib/public-astrologer';

function BookMeetingContent() {
  const searchParams = useSearchParams();
  const { status } = useSession();
  const authModal = useAuthModal();
  const isAuthed = status === 'authenticated';

  const queryId = searchParams.get('astrologerId')?.trim() || '';
  const [astro, setAstro] = useState<AstrologerPublicProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(queryId));

  const loadAstrologer = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const rows = await publicAstrologerApi.listActive({ pageNo: 0, pageSize: 100 });
      setAstro(rows.find((r) => r.id === id) ?? null);
    } catch {
      setAstro(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const intent = readAstrologerIntent();
    const id = queryId || (intent?.action === 'book' ? intent.astrologerId : '');
    if (!id) {
      setAstro(null);
      setLoading(false);
      return;
    }
    if (intent?.astrologerId === id) {
      /* keep intent until booking starts */
    } else {
      saveAstrologerIntent({ astrologerId: id, action: 'book' });
    }
    if (status === 'loading') return;
    void loadAstrologer(id);
  }, [queryId, loadAstrologer, status]);

  const handleBook = () => {
    const id = astro?.id || queryId || readAstrologerIntent()?.astrologerId;
    const meetingsTarget = id
      ? `/meetings?astrologerId=${encodeURIComponent(id)}`
      : '/meetings';

    if (id) {
      saveAstrologerIntent({
        astrologerId: id,
        action: 'book',
        name: astro?.name,
      });
    }

    if (isAuthed) {
      clearAstrologerIntent();
      window.location.href = meetingsTarget;
      return;
    }
    authModal?.openLogin(id ? bookAstrologerPath(id) : '/book-meeting');
  };

  return (
    <div className="naad-site naad-horoscope-shell">
      <header className="naad-horoscope-intro">
        <h1>Book a consultation</h1>
        <p className="naad-page-lead">
          Secure a private live session with your selected Naad astrologer.
        </p>
      </header>

      <div className="naad-section-inner" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
        <div className="naad-book-grid">
          <article className="naad-book-panel">
            {loading ? (
              <div className="naad-astro-loading" style={{ padding: '1.5rem 0' }}>
                <Loader2 className="animate-spin" size={18} />
                <span>Loading astrologer…</span>
              </div>
            ) : astro ? (
              <div className="naad-book-selected">
                <p className="naad-astro-detail-eyebrow">Selected astrologer</p>
                <div className="naad-book-selected-row">
                  <div className="naad-astro-avatar">
                    {astro.photoUrl ? (
                      <img
                        src={astro.photoUrl}
                        alt=""
                        className="naad-astro-avatar-img"
                        width={64}
                        height={64}
                      />
                    ) : (
                      <span className="naad-astro-avatar-fallback" aria-hidden>
                        <UserCircle size={32} strokeWidth={1.25} />
                        <span>{astro.name.slice(0, 1).toUpperCase()}</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <h2>{astro.name}</h2>
                    <div className="naad-astro-rating-row">
                      <AstrologerStarDisplay value={astro.averageRating} />
                      <span className="naad-astro-rating-num">
                        {formatAstrologerRating(astro.averageRating)}
                      </span>
                      <span className="naad-astro-review-count">
                        ({astro.reviewCount ?? 0} reviews)
                      </span>
                    </div>
                    <Link href={astrologerDetailPath(astro.id)} className="naad-book-profile-link">
                      View full profile →
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="naad-book-selected naad-book-selected--empty">
                <h2>Select an astrologer</h2>
                <p>Choose a practitioner from our directory, then return here to continue booking.</p>
                <Link href="/astrologers" className="naad-btn-ghost naad-btn-sm">
                  Browse astrologers
                </Link>
              </div>
            )}

            <h2 style={{ marginTop: astro ? '1.75rem' : '1.25rem' }}>Booking process</h2>
            <ol className="naad-book-steps">
              <li>Sign in or create your Naad Official account</li>
              <li>Your selected astrologer remains linked to this consultation</li>
              <li>Join the secure meeting room at the scheduled time</li>
            </ol>
            <div className="naad-hero-actions" style={{ marginTop: '1.5rem' }}>
              <button type="button" className="naad-btn-primary naad-btn-sm" onClick={handleBook}>
                {isAuthed
                  ? astro
                    ? `Continue with ${astro.name.split(' ')[0]}`
                    : 'Go to meetings'
                  : 'Sign in to book'}
              </button>
              {!isAuthed && authModal && (
                <button
                  type="button"
                  className="naad-btn-ghost naad-btn-sm"
                  onClick={() => {
                    const id = astro?.id || queryId;
                    if (id) {
                      saveAstrologerIntent({
                        astrologerId: id,
                        action: 'book',
                        name: astro?.name,
                      });
                      authModal.openRegister(bookAstrologerPath(id));
                    } else {
                      authModal.openRegister('/book-meeting');
                    }
                  }}
                >
                  Create an account
                </button>
              )}
            </div>
          </article>

          <aside className="naad-book-panel naad-book-aside">
            <h2>Related resources</h2>
            <ul className="naad-book-links">
              <li>
                <Link href="/astrologers">Astrologer directory →</Link>
              </li>
              <li>
                <Link href="/horoscope">Horoscope readings →</Link>
              </li>
              <li>
                <Link href="/date-converter">Calendar converter →</Link>
              </li>
            </ul>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default function BookMeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="naad-site naad-horoscope-shell">
          <div className="naad-astro-loading" style={{ padding: '4rem' }}>
            <Loader2 className="animate-spin" size={22} />
            <span>Loading…</span>
          </div>
        </div>
      }
    >
      <BookMeetingContent />
    </Suspense>
  );
}
