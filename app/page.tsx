'use client';

import {
  Suspense,
  useEffect,
  useRef,
  type ComponentType,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Footer from './components/Footer';
import { useAuthModal } from './components/AuthModalContext';
import {
  AstrologerMotionIcon,
  CalendarMotionIcon,
  HoroscopeMotionIcon,
  KundaliMotionIcon,
  MatchMotionIcon,
  TransitsMotionIcon,
} from './components/home/ServiceMotionIcons';

const HeroCosmicVisual = dynamic(() => import('./components/home/HeroCosmicVisual'), {
  ssr: false,
  loading: () => <div className="naad-hero-visual" aria-hidden />,
});

type ServiceIcon = ComponentType<{ className?: string }>;

const SERVICES: Array<{
  title: string;
  description: string;
  href: string;
  cta: string;
  Icon: ServiceIcon;
  tone: 'horoscope' | 'kundali' | 'match' | 'astrologer' | 'calendar' | 'transits';
}> = [
  {
    title: 'Horoscope readings',
    description:
      'Daily through yearly forecasts for all twelve signs — clear structure for practical planning.',
    href: '/horoscope',
    cta: 'View readings',
    Icon: HoroscopeMotionIcon,
    tone: 'horoscope',
  },
  {
    title: 'Birth kundali',
    description:
      'Generate a North or South Indian chart from birth details — houses, grahas, and chart geometry.',
    href: '/astrology/birth-chart',
    cta: 'Open kundali',
    Icon: KundaliMotionIcon,
    tone: 'kundali',
  },
  {
    title: 'Match making',
    description:
      'Ashtakoot-style kundali matching and sun-sign compatibility for relationship insight.',
    href: '/astrology/compatibility',
    cta: 'Check compatibility',
    Icon: MatchMotionIcon,
    tone: 'match',
  },
  {
    title: 'Astrologer consultations',
    description:
      'Compare verified practitioners, read client ratings, and book a private live session.',
    href: '/astrologers',
    cta: 'Meet astrologers',
    Icon: AstrologerMotionIcon,
    tone: 'astrologer',
  },
  {
    title: 'Calendar conversion',
    description:
      'Convert Gregorian (A.D.) and Bikram Sambat (B.S.) with a month calendar built for Nepal.',
    href: '/date-converter',
    cta: 'Open converter',
    Icon: CalendarMotionIcon,
    tone: 'calendar',
  },
  {
    title: 'Planetary transits',
    description:
      'Track current planetary positions and transit context alongside your birth chart work.',
    href: '/astrology/transits',
    cta: 'View transits',
    Icon: TransitsMotionIcon,
    tone: 'transits',
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

/** One shared observer for all homepage reveals — avoids N IntersectionObservers. */
let sharedRevealObserver: IntersectionObserver | null = null;
const revealTargets = new WeakMap<Element, boolean>();

function getRevealObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;
  if (sharedRevealObserver) return sharedRevealObserver;
  sharedRevealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        const once = revealTargets.get(entry.target) !== false;
        if (once) sharedRevealObserver?.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  );
  return sharedRevealObserver;
}

function useRevealOnScroll<T extends HTMLElement>(options?: { once?: boolean }) {
  const ref = useRef<T | null>(null);
  const once = options?.once ?? true;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.classList.add('is-revealed');
      return;
    }
    revealTargets.set(el, once);
    const io = getRevealObserver();
    io?.observe(el);
    return () => {
      io?.unobserve(el);
    };
  }, [once]);

  return ref;
}

function Reveal({
  className = '',
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  const ref = useRevealOnScroll<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`naad-reveal ${className}`.trim()}
      style={{ ['--naad-card-i' as string]: String(delay) }}
    >
      {children}
    </div>
  );
}

function RevealStep({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const ref = useRevealOnScroll<HTMLLIElement>();
  return (
    <li
      ref={ref}
      className="naad-reveal naad-reveal--lift naad-home-step"
      style={{ ['--naad-card-i' as string]: String(index) }}
    >
      {children}
    </li>
  );
}

/** Lightweight static wash — no blur filters / continuous orb animation. */
function SectionAmbient({ variant = 'ink' }: { variant?: 'ink' | 'soft' }) {
  return (
    <div className={`naad-section-ambient naad-section-ambient--static naad-section-ambient--${variant}`} aria-hidden>
      <span className="naad-section-ambient-glow naad-section-ambient-glow--a" />
      <span className="naad-section-ambient-glow naad-section-ambient-glow--b" />
    </div>
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
            Professional astrology for modern life — horoscope forecasts, kundali tools, match making,
            and private consultations with trusted practitioners.
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

      <section className="naad-section naad-section-ink naad-section--motion naad-section--lazy">
        <SectionAmbient variant="ink" />
        <div className="naad-section-inner">
          <Reveal>
            <div className="naad-section-head">
              <h2>Guidance, charted with care</h2>
              <p>
                Horoscope, kundali, match making, and consultations — each tool designed for clarity
                and professional presentation.
              </p>
            </div>
          </Reveal>
          <div className="naad-service-showcase">
            {SERVICES.map((service, index) => {
              const Icon = service.Icon;
              return (
                <Reveal key={service.href} className="naad-service-showcase-item" delay={index}>
                  <Link
                    href={service.href}
                    className={`naad-service-card naad-service-card--${service.tone}`}
                    style={{ ['--naad-card-i' as string]: String(index) }}
                  >
                    <span className="naad-service-card-icon" aria-hidden>
                      <Icon className="naad-service-card-svg" />
                    </span>
                    <div className="naad-service-card-copy">
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                      <span className="naad-service-card-cta">
                        {service.cta}
                        <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="naad-section naad-section--lazy">
        <div className="naad-section-inner">
          <Reveal>
            <div className="naad-section-head">
              <h2>How Naad works</h2>
              <p>From zodiac insight to one-to-one consultation — a clear path for every stage of guidance.</p>
            </div>
          </Reveal>
          <ol className="naad-home-steps">
            {STEPS.map((step, index) => (
              <RevealStep key={step.n} index={index}>
                <span className="naad-home-step-n" aria-hidden>
                  {step.n}
                </span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </RevealStep>
            ))}
          </ol>
        </div>
      </section>

      <section className="naad-section naad-section-ink naad-section--motion naad-section--lazy">
        <SectionAmbient variant="ink" />
        <div className="naad-section-inner">
          <Reveal>
            <div className="naad-section-head">
              <h2>The twelve signs</h2>
              <p>Access curated horoscope content for every zodiac — prepared for daily and long-range planning.</p>
            </div>
          </Reveal>
          <Reveal>
            <div className="naad-zodiac-strip" role="list">
              {ZODIAC.map((z, index) => (
                <Link
                  key={z.name}
                  href="/horoscope"
                  className="naad-zodiac-chip"
                  role="listitem"
                  title={`${z.name} horoscope`}
                  style={{ ['--naad-chip-i' as string]: String(index) }}
                >
                  <span className="naad-zodiac-chip-glyph" aria-hidden>
                    {z.symbol}
                  </span>
                  <em>{z.name}</em>
                </Link>
              ))}
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="naad-inline-link">
              <Link href="/horoscope">Browse all readings →</Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="naad-section naad-section--lazy">
        <div className="naad-section-inner">
          <Reveal>
            <div className="naad-section-head">
              <h2>Built for serious guidance</h2>
              <p>A disciplined platform experience — tradition respected, presentation refined.</p>
            </div>
          </Reveal>
          <div className="naad-home-pillars">
            {PILLARS.map((item, index) => (
              <Reveal key={item.title} delay={index}>
                <article className="naad-home-pillar">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="naad-home-band naad-section--lazy">
        <div className="naad-section-inner naad-home-band-inner">
          <Reveal>
            <div>
              <h2>Private astrologer consultations</h2>
              <p>
                Compare active practitioners, review ratings from real clients, and book a confidential
                live session on your schedule.
              </p>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="naad-hero-actions">
              <Link href="/astrologers" className="naad-btn-primary">
                View astrologers
              </Link>
              <Link href="/book-meeting" className="naad-btn-ghost">
                Book a consultation
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="naad-section naad-section--lazy">
        <div className="naad-section-inner">
          <Reveal>
            <div className="naad-section-head">
              <h2>Company &amp; support</h2>
              <p>Learn about Naad Official, find answers, or speak with our team.</p>
            </div>
          </Reveal>
          <div className="naad-service-row">
            {EXPLORE.map((item, index) => (
              <Reveal key={item.href} delay={index} className="naad-reveal--slide">
                <Link href={item.href} className="naad-service-link">
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                  <span className="naad-service-arrow" aria-hidden>
                    →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="naad-section naad-section-ink naad-home-close naad-section--lazy">
        <div className="naad-section-inner">
          <Reveal>
            <div className="naad-section-head">
              <h2>Begin with today’s forecast</h2>
              <p>A clear reading for your sign — available whenever you need grounded perspective.</p>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <div className="naad-hero-actions">
              <Link href="/horoscope" className="naad-btn-primary">
                Open horoscope
              </Link>
              <Link href="/astrology/compatibility" className="naad-btn-ghost">
                Try match making
              </Link>
            </div>
          </Reveal>
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
