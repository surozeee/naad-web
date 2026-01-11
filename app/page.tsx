import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <span className="text-8xl animate-pulse">✨</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome to Mystical Insights
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Discover your destiny through the ancient wisdom of horoscopes, astrology, palmistry, puja, and spiritual music. 
            Unlock the secrets the universe has written in the stars and your hands.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/horoscope"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Explore Horoscope
            </Link>
            <Link 
              href="/palmistry"
              className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-full font-semibold text-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg border-2 border-purple-200 dark:border-purple-800"
            >
              Discover Palmistry
            </Link>
          </div>
        </div>

        {/* Main Services Section */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          <Link href="/horoscope" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 dark:border-purple-900 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 dark:bg-purple-900 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <div className="relative">
                <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">♈</div>
                <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Horoscope
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Explore your daily, weekly, and monthly horoscope predictions based on your zodiac sign. Discover what the stars have in store for you, including lucky numbers, colors, and compatibility insights.
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold">
                  Explore Horoscope
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/palmistry" className="group">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100 dark:border-pink-900 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200 dark:bg-pink-900 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <div className="relative">
                <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">🖐️</div>
                <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                  Palmistry
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Unlock the secrets of your palm. Learn about your life lines, heart lines, and what your hands reveal about your personality, relationships, and future path.
                </p>
                <div className="flex items-center text-pink-600 dark:text-pink-400 font-semibold">
                  Explore Palmistry
                  <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Statistics Section */}
        <div className="max-w-6xl mx-auto mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-purple-100 dark:border-purple-900">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">10K+</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Happy Users</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-pink-100 dark:border-pink-900">
              <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Readings Done</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-indigo-100 dark:border-indigo-900">
              <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">12</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">Zodiac Signs</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center shadow-lg border border-purple-100 dark:border-purple-900">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">4.9★</div>
              <div className="text-gray-600 dark:text-gray-400 text-sm">User Rating</div>
            </div>
          </div>
        </div>

        {/* All Services Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Our Services
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Explore all our mystical services designed to guide you on your spiritual journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/astrology" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-indigo-100 dark:border-indigo-900">
                <div className="text-5xl mb-4">⭐</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Astrology
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Discover your birth chart, planetary positions, and cosmic influences that shape your destiny.
                </p>
              </div>
            </Link>

            <Link href="/puja" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-yellow-100 dark:border-yellow-900">
                <div className="text-5xl mb-4">🕉️</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                  Puja Services
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Connect with the divine through traditional puja ceremonies and spiritual rituals.
                </p>
              </div>
            </Link>

            <Link href="/music" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100 dark:border-blue-900">
                <div className="text-5xl mb-4">🎵</div>
                <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Spiritual Music
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Immerse yourself in devotional music, mantras, and chants for spiritual upliftment.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Choose Us
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Experience the best in mystical guidance and spiritual services
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-100 dark:border-purple-900">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Daily Insights</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get personalized daily horoscope readings tailored to your zodiac sign and birth chart.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-pink-100 dark:border-pink-900">
              <div className="text-4xl mb-4">🔮</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Expert Analysis</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Comprehensive palmistry and astrology readings by experienced practitioners.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-900">
              <div className="text-4xl mb-4">💫</div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Ancient Wisdom</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Discover timeless insights based on centuries of astrological and palmistry knowledge.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              What Our Users Say
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Real experiences from our community
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-100 dark:border-purple-900">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                  A
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-white">Anjali Sharma</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "The daily horoscope readings are incredibly accurate and insightful. It's become part of my morning routine!"
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-pink-100 dark:border-pink-900">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                  R
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-white">Rajesh Kumar</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "The palmistry reading revealed aspects of my personality I never knew. Highly recommended!"
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-900">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg mr-3">
                  P
                </div>
                <div>
                  <div className="font-bold text-gray-800 dark:text-white">Priya Patel</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic">
                "The astrology services helped me understand my life path better. The birth chart analysis was detailed and accurate."
              </p>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Choose Your Service</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Select from horoscope, astrology, palmistry, puja, or music services
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Provide Details</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Enter your birth details, zodiac sign, or upload palm images as required
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800 dark:text-white">Get Your Reading</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Receive detailed insights and guidance based on ancient wisdom
              </p>
            </div>
          </div>
        </div>

        {/* Quote Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 shadow-xl border border-purple-100 dark:border-purple-900">
            <div className="text-5xl mb-6">"</div>
            <p className="text-2xl md:text-3xl text-gray-700 dark:text-gray-200 italic mb-6 leading-relaxed">
              The stars align, and your palm tells a story. Discover what destiny has in store for you.
            </p>
            <div className="text-gray-500 dark:text-gray-400 font-semibold">
              — Mystical Insights
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Discover Your Destiny?</h2>
            <p className="text-lg mb-8 text-purple-100">
              Start your spiritual journey today with our comprehensive mystical services
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                href="/horoscope"
                className="px-8 py-4 bg-white text-purple-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
              >
                Get Your Horoscope
              </Link>
              <Link 
                href="/palmistry"
                className="px-8 py-4 bg-purple-700 text-white rounded-full font-semibold text-lg hover:bg-purple-800 transition-all transform hover:scale-105 shadow-lg border-2 border-white/30"
              >
                Try Palmistry
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
