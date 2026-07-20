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
  icon: 'horoscope' | 'date' | 'meeting';
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
    title: 'Book a meeting',
    description: 'Schedule a personal session with a trusted Naad astrologer.',
    href: '/book-meeting',
    icon: 'meeting',
    cta: 'Book now',
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
      <path
        d="M8 14a4 4 0 118 0v1.5a2.5 2.5 0 01-2.5 2.5h-3A2.5 2.5 0 018 15.5V14z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 19.5c1.2-2 3.2-3 7.5-3s6.3 1 7.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
            <Link href="/book-meeting" className="naad-btn-ghost">
              Book an astrologer
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
