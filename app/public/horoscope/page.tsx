'use client';

import Link from 'next/link';
import { HoroscopeListView } from '@/app/horoscope/components/HoroscopeListView';
import { useAuthModal } from '@/app/components/AuthModalContext';
import { useTheme } from '@/app/components/ThemeProvider';
import Footer from '@/app/components/Footer';

/**
 * Public replica of /horoscope/list — no login required.
 * Linked from the homepage; data loads published ACTIVE horoscopes only.
 */
export default function PublicHoroscopePage() {
  const authModal = useAuthModal();
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
            >
              Naad Official
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              >
                Home
              </Link>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Horoscope</span>
              {authModal ? (
                <button
                  type="button"
                  onClick={() => authModal.openLogin()}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Login
                </button>
              ) : null}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
                title={isDark ? 'Switch theme' : 'Switch theme'}
              >
                {isDark ? (
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <HoroscopeListView publicMode />
      </div>

      <Footer />
    </div>
  );
}
