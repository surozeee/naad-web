'use client';

import { usePathname } from 'next/navigation';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't add padding on dashboard routes or pages that use DashboardLayout
  // These pages have their own layout and don't need the top padding
  const isDashboardRoute = pathname?.startsWith('/dashboard') || 
                          pathname?.startsWith('/astrology') ||
                          pathname?.startsWith('/horoscope') ||
                          pathname?.startsWith('/puja') ||
                          pathname?.startsWith('/music') ||
                          pathname?.startsWith('/customer') ||
                          pathname?.startsWith('/event-management') ||
                          pathname?.startsWith('/master-setting') ||
                          pathname?.startsWith('/user-management');
  
  return (
    <main className={isDashboardRoute ? '' : 'pt-16'}>
      {children}
    </main>
  );
}

