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
    title: 'Horoscope readings',
    description:
      'Structured daily, weekly, monthly, and yearly forecasts across all twelve zodiac signs.',
    href: '/horoscope',
    icon: 'horoscope',
    cta: 'View readings',
  },
  {
    title: 'Calendar conversion',
    description:
      'Convert between Gregorian (A.D.) and Bikram Sambat (B.S.) with a clear month calendar.',
    href: '/date-converter',
    icon: 'date',
    cta: 'Open converter',
  },
  {
    title: 'Astrologer consultations',
    description:
      'Review verified profiles, ratings, and reviews — then book a private live session.',
    href: '/astrologers',
    icon: 'astrologer',
    cta: 'Meet astrologers',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Select your zodiac',
    text: 'Begin with the sign that corresponds to your birth chart for today’s planetary outlook.',
  },
  {
    n: '02',
    title: 'Review your reading',
    text: 'Access concise forecasts by day, week, month, or year — written for informed decisions.',
  },
  {
    n: '03',
    title: 'Consult a professional',
    text: 'For personal guidance, schedule a confidential session with a Naad-listed astrologer.',
  },
];

const ZODIAC = [
  { symbol: '♈', name: 'Aries' },
  { symbol: '♉', name: 'Taurus' },
  { symbol: '♊', name: 'Gemini' },
  { symbol: '♋', name: 'Cancer' },
  { symbol: '♌', name: 'Leo' },
  { symbol: '♍', name: 'Virgo' },
  { symbol: '♎', name: 'Libra' },
  { symbol: '♏', name: 'Scorpio' },
  { symbol: '♐', name: 'Sagittarius' },
  { symbol: '♑', name: 'Capricorn' },
  { symbol: '♒', name: 'Aquarius' },
  { symbol: '♓', name: 'Pisces' },
];

const PILLARS = [
  {
    title: 'Editorial clarity',
    text: 'Readings are composed for precision and readability — practical insight without excess jargon.',
  },
  {
    title: 'Nepali calendar accuracy',
    text: 'Reliable A.D. ↔ B.S. conversion with a month view designed around Nepal’s calendar practice.',
  },
  {
    title: 'Verified consultations',
    text: 'Book sessions with listed astrologers and review authentic customer ratings before you decide.',
  },
];

const EXPLORE = [
  {
    href: '/about-us',
    title: 'About Naad',
    text: 'Our mission: trusted astrology guidance delivered with modern professionalism.',
  },
  {
    href: '/faq',
    title: 'FAQ',
    text: 'Guidance on readings, consultations, accounts, and platform use.',
  },
  {
    href: '/contact-us',
    title: 'Contact',
    text: 'Support, partnerships, and professional inquiries.',
  },
  {
    href: '/book-meeting',
    title: 'Book a consultation',
    text: 'Secure your place for a private live meeting with an astrologer.',
  },
];

function FeatureIcon({ type }: { type: (typeof FEATURES)[number]['icon'] }) {
  if (type === 'horoscope') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
        <path
          d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (type === 'date') {
    return (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 3.5v3M16 3.5v3M3.5 10h17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
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
            Professional astrology for modern life — horoscope forecasts, calendar tools, and private
            consultations with trusted practitioners.
          </p>
          <div className="naad-hero-actions">
            <Link href="/horoscope" className="naad-btn-primary">
              Today&apos;s horoscope
            </Link>
            <Link href="/astrologers" className="naad-btn-ghost">
              Consult an astrologer
            </Link>
          </div>
        </div>
      </section>

      <section className="naad-section naad-section-ink">
        <div className="naad-section-inner">
          <div className="naad-section-head">
            <h2>How Naad works</h2>
            <p>From zodiac insight to one-to-one consultation — a clear path for every stage of guidance.</p>
          </div>
          <ol className="naad-home-steps">
            {STEPS.map((step) => (
              <li key={step.n} className="naad-home-step">
                <span className="naad-home-step-n" aria-hidden>
                  {step.n}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="naad-section">
        <div className="naad-section-inner">
          <div className="naad-section-head">
            <h2>The twelve signs</h2>
            <p>Access curated horoscope content for every zodiac — prepared for daily and long-range planning.</p>
          </div>
          <div className="naad-zodiac-strip" role="list">
            {ZODIAC.map((z) => (
              <Link
                key={z.name}
                href="/horoscope"
                className="naad-zodiac-chip"
                role="listitem"
                title={`${z.name} horoscope`}
              >
                <span aria-hidden>{z.symbol}</span>
                <em>{z.name}</em>
              </Link>
            ))}
          </div>
          <div className="naad-inline-link">
            <Link href="/horoscope">Browse all readings →</Link>
          </div>
        </div>
      </section>

      <section className="naad-section naad-section-ink">
        <div className="naad-section-inner">
          <div className="naad-section-head">
            <h2>Built for serious guidance</h2>
            <p>A disciplined platform experience — tradition respected, presentation refined.</p>
          </div>
          <div className="naad-home-pillars">
            {PILLARS.map((item) => (
              <article key={item.title} className="naad-home-pillar">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="naad-home-band">
        <div className="naad-section-inner naad-home-band-inner">
          <div>
            <h2>Private astrologer consultations</h2>
            <p>
              Compare active practitioners, review ratings from real clients, and book a confidential
              live session on your schedule.
            </p>
          </div>
          <div className="naad-hero-actions">
            <Link href="/astrologers" className="naad-btn-primary">
              View astrologers
            </Link>
            <Link href="/book-meeting" className="naad-btn-ghost">
              Book a consultation
            </Link>
          </div>
        </div>
      </section>

      <section className="naad-section">
        <div className="naad-section-inner">
          <div className="naad-section-head">
            <h2>Company &amp; support</h2>
            <p>Learn about Naad Official, find answers, or speak with our team.</p>
          </div>
          <div className="naad-service-row">
            {EXPLORE.map((item) => (
              <Link key={item.href} href={item.href} className="naad-service-link">
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <span className="naad-service-arrow" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="naad-section naad-section-ink naad-home-close">
        <div className="naad-section-inner">
          <div className="naad-section-head">
            <h2>Begin with today’s forecast</h2>
            <p>A clear reading for your sign — available whenever you need grounded perspective.</p>
          </div>
          <div className="naad-hero-actions">
            <Link href="/horoscope" className="naad-btn-primary">
              Open horoscope
            </Link>
            <Link href="/date-converter" className="naad-btn-ghost">
              Convert a date
            </Link>
          </div>
        </div>
      </section>

      <section className="naad-section">
        <div className="naad-section-inner">
          <div className="naad-section-head">
            <h2>Platform capabilities</h2>
            <p>Core tools for astrology guidance, calendar planning, and professional consultation.</p>
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
