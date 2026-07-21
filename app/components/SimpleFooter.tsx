'use client';

import { usePathname } from 'next/navigation';

export default function SimpleFooter() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  
  // Don't show on homepage (homepage has full footer)
  if (pathname === '/') {
    return null;
  }
  
  return (
    <footer className="dashboard-footer border-t py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm" style={{ color: 'var(--naad-fg-muted)' }}>
          <div>
            © {currentYear} Naad Official. All rights reserved.
          </div>
          <div>
            Developed by{' '}
            <a
              href="https://jojolapatech.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors"
              style={{ color: 'var(--naad-primary)' }}
            >
              Jojolapa Tech Pvt Ltd
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
