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
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div>
            © {currentYear} Naad Official. All rights reserved.
          </div>
          <div>
            Developed by{' '}
            <a 
              href="https://jojolapatech.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline transition-colors"
            >
              Jojolapa Tech Pvt Ltd
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
