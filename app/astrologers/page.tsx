'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Loader2, Search, UserCircle } from 'lucide-react';
import Footer from '@/app/components/Footer';
import AstrologerReviewList from '@/app/components/astrologer/AstrologerReviewList';
import {
  AstrologerStarDisplay,
  formatAstrologerRating,
} from '@/app/components/astrologer/AstrologerStarDisplay';
import { useAuthModal } from '@/app/components/AuthModalContext';
import type { AstrologerPublicProfile } from '@/app/lib/astrologer.types';
import { PUBLIC_ASTROLOGER_REVIEW_LIMIT, publicAstrologerApi } from '@/app/lib/public-astrologer';

function AstrologerAvatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt=""
        className="naad-astro-avatar-img"
        width={72}
        height={72}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="naad-astro-avatar-fallback" aria-hidden>
      <UserCircle size={40} strokeWidth={1.25} />
      <span>{name.slice(0, 1).toUpperCase()}</span>
    </span>
  );
}

export default function AstrologersPage() {
  const { status } = useSession();
  const authModal = useAuthModal();
  const isAuthed = status === 'authenticated';

  const [astrologers, setAstrologers] = useState<AstrologerPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await publicAstrologerApi.listActive({
        pageNo: 0,
        pageSize: 50,
        search: search.trim() || undefined,
        sortBy: 'name',
        sortDirection: 'asc',
      });
      setAstrologers(rows);
    } catch {
      setAstrologers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    // Wait for session resolve so bearer can be attached when logged in
    if (status === 'loading') return;
    const t = window.setTimeout(() => void loadList(), search ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [loadList, search, status]);

  const handleRate = (astrologerId: string) => {
    const target = `/dashboard/rate-astrologer?astrologerId=${encodeURIComponent(astrologerId)}`;
    if (isAuthed) {
      window.location.href = target;
      return;
    }
    authModal?.openLogin(target);
  };

  return (
    <div className="naad-site naad-horoscope-shell">
      <header className="naad-horoscope-intro">
        <h1>Our astrologers</h1>
        <p>
          Meet Naad astrologers, read customer ratings and reviews, and book a personal session when
          you are ready.
        </p>
      </header>

      <div className="naad-section-inner naad-astro-page">
        <div className="naad-astro-toolbar">
          <label className="naad-astro-search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              aria-label="Search astrologers"
            />
          </label>
          <Link href="/book-meeting" className="naad-btn-ghost naad-astro-book-link">
            Book a session
          </Link>
        </div>

        {loading ? (
          <div className="naad-astro-loading">
            <Loader2 className="animate-spin" size={22} />
            <span>Loading astrologers…</span>
          </div>
        ) : astrologers.length === 0 ? (
          <div className="naad-astro-empty">
            <p>No active astrologers found right now.</p>
            <Link href="/contact-us" className="naad-btn-ghost">
              Contact us
            </Link>
          </div>
        ) : (
          <div className="naad-astro-grid">
            {astrologers.map((astro) => {
              const expanded = expandedId === astro.id;
              return (
                <article key={astro.id} className="naad-astro-card">
                  <div className="naad-astro-card-top">
                    <div className="naad-astro-avatar">
                      <AstrologerAvatar name={astro.name} photoUrl={astro.photoUrl} />
                    </div>
                    <div className="naad-astro-card-head">
                      <h2>{astro.name}</h2>
                      <div className="naad-astro-rating-row">
                        <AstrologerStarDisplay value={astro.averageRating} />
                        <span className="naad-astro-rating-num">
                          {formatAstrologerRating(astro.averageRating)}
                        </span>
                        <span className="naad-astro-review-count">
                          ({astro.reviewCount ?? 0} review{(astro.reviewCount ?? 0) === 1 ? '' : 's'})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="naad-astro-card-actions">
                    <button
                      type="button"
                      className="naad-btn-ghost"
                      onClick={() => setExpandedId(expanded ? null : astro.id)}
                    >
                      {expanded ? 'Hide reviews' : 'View reviews'}
                    </button>
                    <button type="button" className="naad-btn-primary" onClick={() => handleRate(astro.id)}>
                      Rate astrologer
                    </button>
                  </div>

                  <div className={expanded ? 'naad-astro-card-reviews' : 'naad-astro-card-preview'}>
                    {expanded ? (
                      <p className="naad-astro-reviews-heading">Latest {PUBLIC_ASTROLOGER_REVIEW_LIMIT} reviews</p>
                    ) : null}
                    <AstrologerReviewList
                      reviews={astro.reviews}
                      fromSeed={astro.reviewsFromSeed}
                      compact={!expanded}
                      limit={PUBLIC_ASTROLOGER_REVIEW_LIMIT}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
