'use client';

import { usePathname } from 'next/navigation';

export default function MainContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Don't add padding on dashboard routes (dashboard has its own layout)
  const isDashboard = pathname?.startsWith('/dashboard');
  
  return (
    <main className={isDashboard ? '' : 'pt-16'}>
      {children}
    </main>
  );
}

