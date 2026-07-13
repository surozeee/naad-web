'use client';

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Footer from "./components/Footer";
import { useAuthModal } from "./components/AuthModalContext";

function HomeContent() {
  const searchParams = useSearchParams();
  const authModal = useAuthModal();

  // Open login modal when redirected from protected route (?login=1&redirect=...)
  useEffect(() => {
    if (searchParams.get('login') === '1' && authModal) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      authModal.openLogin(redirect);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, [searchParams, authModal]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Full Width (same light/dark gradient as CTA section) */}
      <section className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white dark:text-white">
                Welcome to Naad Official
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-purple-100 dark:text-white leading-relaxed">
                Your trusted platform for spiritual guidance, horoscope readings, astrology insights, and divine services.
                Discover your destiny with ancient wisdom and modern technology.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/horoscope"
                  className="px-8 py-4 bg-white dark:bg-white/10 text-purple-600 dark:text-white rounded-lg font-semibold text-lg hover:bg-gray-100 dark:hover:bg-white/20 transition-all transform hover:scale-105 shadow-xl dark:border dark:border-white/20"
                >
                  View Horoscope
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview - Full Width */}
      <section className="w-full bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Our Services
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Comprehensive spiritual and mystical services designed to guide you on your journey
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link href="/horoscope" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 dark:border-purple-900 h-full">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">♈</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  Horoscope
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Daily, weekly, monthly, and yearly horoscope predictions based on your zodiac sign.
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold">
                  View readings <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            <Link href="/palmistry" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-indigo-100 dark:border-indigo-900 h-full">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">🖐️</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  Palmistry
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Discover what your palms reveal about your personality, relationships, career, and life path.
                </p>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold">
                  Learn More <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            <Link href="/music" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-blue-100 dark:border-blue-900 h-full">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">🎵</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Spiritual Music
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Devotional music, mantras, bhajans, and chants for spiritual upliftment and inner peace.
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold">
                  Learn More <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 dark:from-purple-900 dark:via-purple-800 dark:to-indigo-900 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white dark:text-white mb-6">
            Ready to Begin Your Spiritual Journey?
          </h2>
          <p className="text-xl text-purple-100 dark:text-white mb-10 leading-relaxed">
            Join thousands of satisfied customers who trust Naad Official for their spiritual guidance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {authModal && (
              <button
                type="button"
                onClick={() => authModal.openRegister()}
                className="px-10 py-4 bg-white dark:bg-white/10 text-purple-600 dark:text-white rounded-lg font-semibold text-lg hover:bg-gray-100 dark:hover:bg-white/20 transition-all transform hover:scale-105 shadow-xl dark:border dark:border-white/20"
              >
                Get Started Now
              </button>
            )}
            <Link
              href="/horoscope"
              className="px-10 py-4 bg-purple-700/50 dark:bg-purple-500/30 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 dark:hover:bg-purple-500/50 transition-all transform hover:scale-105 border-2 border-white/30"
            >
              View Horoscope
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <span className="text-slate-500 dark:text-slate-400">Loading...</span>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
