'use client';

import { usePathname } from 'next/navigation';
import SimpleFooter from './SimpleFooter';
import { isPublicMarketingPath } from '@/app/lib/public-routes';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicMarketing = isPublicMarketingPath(pathname);
  const isPublicShell =
    pathname === '/horoscope' ||
    pathname === '/date-converter' ||
    pathname === '/book-meeting' ||
    pathname === '/about-us' ||
    pathname === '/faq' ||
    pathname === '/privacy-policy' ||
    pathname === '/contact-us' ||
    Boolean(pathname?.startsWith('/cms/'));
  const isDashboardRoute =
    !isPublicShell &&
    (pathname?.startsWith('/dashboard') ||
      pathname?.startsWith('/astrology') ||
      pathname?.startsWith('/horoscope') ||
      pathname?.startsWith('/puja') ||
      pathname?.startsWith('/music') ||
      pathname?.startsWith('/customer') ||
      pathname?.startsWith('/meetings') ||
      pathname?.startsWith('/support') ||
      pathname?.startsWith('/settings') ||
      pathname?.startsWith('/profile') ||
      pathname?.startsWith('/event-management') ||
      pathname?.startsWith('/master-setting') ||
      pathname?.startsWith('/user-management'));

  return (
    <>
      <main className={isDashboardRoute ? '' : isPublicMarketing ? '' : 'pt-16'}>{children}</main>
      {!isDashboardRoute && !isPublicMarketing && <SimpleFooter />}
    </>
  );
}
