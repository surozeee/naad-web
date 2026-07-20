/** Shared public marketing route helpers */

export const PUBLIC_MARKETING_PATHS = [
  '/',
  '/horoscope',
  '/date-converter',
  '/astrologers',
  '/book-meeting',
  '/about-us',
  '/faq',
  '/privacy-policy',
  '/contact-us',
] as const;

export function isPublicMarketingPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if ((PUBLIC_MARKETING_PATHS as readonly string[]).includes(pathname)) return true;
  if (pathname.startsWith('/cms/')) return true;
  if (pathname.startsWith('/astrologers/')) return true;
  return false;
}
