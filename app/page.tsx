'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Footer from './components/Footer';
import { useAuthModal } from './components/AuthModalContext';
import HeroCosmicVisual from './components/home/HeroCosmicVisual';

const FEATURES: Array<{
  title: string;
  description: string;
  href: string;
  icon: 'horoscope' | 'date' | 'astrologer';
  cta: string;
}> = [
  {
    title: 'Horoscope',
    description: 'Daily, monthly, and yearly readings for all twelve zodiac signs.',
    href: '/horoscope',
    icon: 'horoscope',
    cta: 'Open readings',
  },
  {
    title: 'Date converter',
    description: 'See today’s date and convert between A.D. and Bikram Sambat (B.S.).',
    href: '/date-converter',
    icon: 'date',
    cta: 'Convert dates',
  },
  {
    title: 'Our astrologers',
    description: 'Browse Naad astrologers, customer ratings, and reviews before you book.',
    href: '/astrologers',
    icon: 'astrologer',
    cta: 'View astrologers',
  },
];

function FeatureIcon({ type }: { type: (typeof FEATURES)[number]['icon'] }) {
  if (type === 'horoscope') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'date') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 3.5v3M16 3.5v3M3.5 10h17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="9" cy="14" r="1" fill="currentColor" />
        <circle cx="12" cy="14" r="1" fill="currentColor" />
        <circle cx="15" cy="14" r="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 20c1.5-3 3.8-4.5 7-4.5s5.5 1.5 7 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 6l2-1.5M18.5 9.5l2 .5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const authModal = useAuthModal();

  useEffect(() => {
    if (searchParams.get('login') === '1' && authModal) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      authModal.openLogin(redirect);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [searchParams, authModal]);

  return (
    <div className="naad-site">
      <section className="naad-hero">
        <div className="naad-hero-sky" />
        <HeroCosmicVisual />
        <div className="naad-hero-content">
          <h1 className="naad-hero-brand">
            Naad <em>Official</em>
          </h1>
          <p className="naad-hero-lead">
            Horoscope, calendar tools, and live sessions with astrologers — guidance for everyday
            clarity.
          </p>
          <div className="naad-hero-actions">
            <Link href="/horoscope" className="naad-btn-primary">
              Read today&apos;s horoscope
            </Link>
            <Link href="/astrologers" className="naad-btn-ghost">
              View our astrologers
            </Link>
          </div>
        </div>
      </section>

      <section className="naad-section">
        <div className="naad-section-inner">
          <div className="naad-section-head">
            <h2>Explore our features</h2>
            <p>Choose a tool below to open its page and get started.</p>
          </div>
          <div className="naad-feature-cards">
            {FEATURES.map((feature, index) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="naad-feature-card"
                style={{ animationDelay: `${0.08 + index * 0.06}s` }}
              >
                <span className="naad-feature-card-icon">
                  <FeatureIcon type={feature.icon} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="naad-feature-card-cta">
                  {feature.cta}
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="naad-site min-h-screen flex items-center justify-center">
          <span style={{ color: 'var(--naad-fg-muted)' }}>Loading…</span>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
