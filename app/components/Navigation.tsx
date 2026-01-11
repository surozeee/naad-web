'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  // Hide navigation on dashboard routes
  if (pathname?.startsWith('/dashboard')) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Naad Official
          </Link>
          <div className="flex gap-6">
            <Link href="/" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Home
            </Link>
            <Link href="/horoscope" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Horoscope
            </Link>
            <Link href="/palmistry" className="text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              Palmistry
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

