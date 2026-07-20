'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthModal } from './AuthModalContext';
import PublicLanguageSelect from './PublicLanguageSelect';
import PublicThemeSelect from './PublicThemeSelect';
import { isPublicMarketingPath } from '@/app/lib/public-routes';

export default function Navigation() {
  const pathname = usePathname();
  const authModal = useAuthModal();

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
            href="/astrologers"
            className={`naad-nav-link hide-sm${pathname === '/astrologers' || pathname.startsWith('/astrologers/') ? ' is-active' : ''}`}
          >
            Astrologers
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
          <PublicThemeSelect />
        </div>
      </div>
    </nav>
  );
}
