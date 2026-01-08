import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Mystical Insights
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover your destiny through ancient wisdom of horoscopes and palmistry
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Link href="/horoscope" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 dark:border-purple-900">
              <div className="text-6xl mb-4">♈</div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Horoscope
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Explore your daily, weekly, and monthly horoscope predictions based on your zodiac sign. Discover what the stars have in store for you.
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold">
                Explore Horoscope
                <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link href="/palmistry" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100 dark:border-pink-900">
              <div className="text-6xl mb-4">🖐️</div>
              <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                Palmistry
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Unlock the secrets of your palm. Learn about your life lines, heart lines, and what your hands reveal about your personality and future.
              </p>
              <div className="flex items-center text-pink-600 dark:text-pink-400 font-semibold">
                Explore Palmistry
                <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 italic">
            "The stars align, and your palm tells a story. Discover what destiny has in store for you."
          </p>
        </div>
      </div>
    </div>
  );
}
