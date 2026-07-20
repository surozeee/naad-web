'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isPublicMarketingPath } from '@/app/lib/public-routes';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  if (!isPublicMarketingPath(pathname)) {
    return null;
  }

  return (
    <footer className="naad-footer">
      <div className="naad-section-inner">
        <div className="naad-footer-grid">
          <div>
            <p className="naad-footer-brand">Naad Official</p>
            <p>Clear horoscope guidance for everyday decisions — rooted in tradition, written for today.</p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li>
                <Link href="/horoscope">Horoscope</Link>
              </li>
              <li>
                <Link href="/date-converter">Date converter</Link>
              </li>
              <li>
                <Link href="/astrologers">Our astrologers</Link>
              </li>
              <li>
                <Link href="/">Home</Link>
              </li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li>
                <Link href="/about-us">About us</Link>
              </li>
              <li>
                <Link href="/faq">FAQ</Link>
              </li>
              <li>
                <Link href="/contact-us">Contact us</Link>
              </li>
              <li>
                <Link href="/privacy-policy">Privacy policy</Link>
              </li>
              <li>
                <a href="mailto:info@naadofficial.com">info@naadofficial.com</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="naad-footer-bottom">
          <p>© {currentYear} Naad Official. All rights reserved.</p>
          <p>
            Built by{' '}
            <a href="https://jojolapatech.com" target="_blank" rel="noopener noreferrer">
              Jojolapa Tech
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
