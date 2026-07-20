'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, Search, UserCircle } from 'lucide-react';
import Footer from '@/app/components/Footer';
import {
  AstrologerStarDisplay,
  formatAstrologerRating,
} from '@/app/components/astrologer/AstrologerStarDisplay';
import { useAuthModal } from '@/app/components/AuthModalContext';
import type { AstrologerPublicProfile } from '@/app/lib/astrologer.types';
import {
  astrologerDetailPath,
  intentRedirectPath,
  saveAstrologerIntent,
} from '@/app/lib/astrologer-intent';
import { publicAstrologerApi } from '@/app/lib/public-astrologer';

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
  const router = useRouter();
  const { status } = useSession();
  const authModal = useAuthModal();
  const isAuthed = status === 'authenticated';

  const [astrologers, setAstrologers] = useState<AstrologerPublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    if (status === 'loading') return;
    const t = window.setTimeout(() => void loadList(), search ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [loadList, search, status]);

  const goWithAuth = (
    e: React.MouseEvent,
    astro: AstrologerPublicProfile,
    action: 'rate' | 'book'
  ) => {
    e.preventDefault();
    e.stopPropagation();
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
      <header className="naad-horoscope-intro">
        <h1>Astrologers</h1>
        <p className="naad-page-lead">
          Verified practitioners for private consultations — review ratings and book with confidence.
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
        </div>

        {loading ? (
          <div className="naad-astro-loading">
            <Loader2 className="animate-spin" size={22} />
            <span>Loading astrologers…</span>
          </div>
        ) : astrologers.length === 0 ? (
          <div className="naad-astro-empty">
            <p>No active astrologers found right now.</p>
            <Link href="/contact-us" className="naad-btn-ghost naad-btn-sm">
              Contact us
            </Link>
          </div>
        ) : (
          <div className="naad-astro-grid">
            {astrologers.map((astro) => (
              <article key={astro.id} className="naad-astro-card">
                <Link href={astrologerDetailPath(astro.id)} className="naad-astro-card-main">
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
                  <span className="naad-astro-card-hint">View profile →</span>
                </Link>

                <div className="naad-astro-card-actions">
                  <button
                    type="button"
                    className="naad-btn-primary naad-btn-sm"
                    onClick={(e) => goWithAuth(e, astro, 'book')}
                  >
                    Book
                  </button>
                  <button
                    type="button"
                    className="naad-btn-ghost naad-btn-sm"
                    onClick={(e) => goWithAuth(e, astro, 'rate')}
                  >
                    Rate
                  </button>
                  <Link
                    href={astrologerDetailPath(astro.id)}
                    className="naad-btn-ghost naad-btn-sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
