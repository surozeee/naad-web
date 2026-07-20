'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthModal } from './AuthModalContext';
import { useTheme, type Theme } from './ThemeProvider';
import PublicLanguageSelect from './PublicLanguageSelect';
import { isPublicMarketingPath } from '@/app/lib/public-routes';

const THEME_OPTIONS: Array<{ id: Theme; label: string; title: string }> = [
  { id: 'cosmic', label: 'Cosmic', title: 'Cosmic Dark' },
  { id: 'celestial', label: 'Light', title: 'Celestial Light' },
  { id: 'divine', label: 'Divine', title: 'Divine Gold' },
];

export default function Navigation() {
  const pathname = usePathname();
  const authModal = useAuthModal();
  const { theme, setTheme } = useTheme();

  if (!pathname || !isPublicMarketingPath(pathname)) {
    return null;
  }

  return (
    <nav className="naad-nav" aria-label="Primary">
      <div className="naad-nav-inner">
        <Link href="/" className="naad-nav-brand">
          Naad <span>Official</span>
        </Link>
        <div className="naad-nav-links">
          <Link
            href="/horoscope"
            className={`naad-nav-link${pathname === '/horoscope' ? ' is-active' : ''}`}
          >
            Horoscope
          </Link>
          <Link
            href="/date-converter"
            className={`naad-nav-link hide-sm${pathname === '/date-converter' ? ' is-active' : ''}`}
          >
            Dates
          </Link>
          <Link
            href="/book-meeting"
            className={`naad-nav-link hide-sm${pathname === '/book-meeting' ? ' is-active' : ''}`}
          >
            Book meeting
          </Link>
          <Link
            href="/about-us"
            className={`naad-nav-link hide-sm${pathname === '/about-us' ? ' is-active' : ''}`}
          >
            About
          </Link>
          <Link
            href="/contact-us"
            className={`naad-nav-link hide-sm${pathname === '/contact-us' ? ' is-active' : ''}`}
          >
            Contact
          </Link>
          {authModal && (
            <>
              <button type="button" className="naad-nav-link hide-sm" onClick={() => authModal.openLogin()}>
                Sign in
              </button>
              <button type="button" className="naad-nav-cta" onClick={() => authModal.openRegister()}>
                Join
              </button>
            </>
          )}
          <PublicLanguageSelect />
          <div className="naad-theme-switch" role="group" aria-label="Color theme">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`naad-theme-btn${theme === opt.id ? ' is-active' : ''}`}
                onClick={() => setTheme(opt.id)}
                title={opt.title}
                aria-pressed={theme === opt.id}
              >
                <span className={`naad-theme-dot naad-theme-dot--${opt.id}`} aria-hidden />
                <span className="naad-theme-label">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
