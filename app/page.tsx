import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Full Width */}
      <section className="w-full bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Welcome to Naad Official
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-purple-100 leading-relaxed">
                Your trusted platform for spiritual guidance, horoscope readings, astrology insights, and divine services. 
                Discover your destiny with ancient wisdom and modern technology.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/dashboard"
                  className="px-8 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
                >
                  Go to Dashboard
                </Link>
                <Link 
                  href="/horoscope"
                  className="px-8 py-4 bg-purple-700/50 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 border-2 border-white/30"
                >
                  Explore Services
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-4xl mb-3">♈</div>
                  <div className="text-3xl font-bold mb-1">12K+</div>
                  <div className="text-purple-100 text-sm">Daily Readings</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-4xl mb-3">⭐</div>
                  <div className="text-3xl font-bold mb-1">8K+</div>
                  <div className="text-purple-100 text-sm">Charts Generated</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-4xl mb-3">🖐️</div>
                  <div className="text-3xl font-bold mb-1">15K+</div>
                  <div className="text-purple-100 text-sm">Palm Readings</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                  <div className="text-4xl mb-3">🕉️</div>
                  <div className="text-3xl font-bold mb-1">5K+</div>
                  <div className="text-purple-100 text-sm">Puja Services</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Statistics - Full Width */}
      <section className="w-full bg-white dark:bg-gray-800 py-16 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">50K+</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-pink-600 dark:text-pink-400 mb-2">200K+</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Readings Completed</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">4.9</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">24/7</div>
              <div className="text-gray-600 dark:text-gray-400 font-medium">Support Available</div>
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
                  Daily, weekly, monthly, and yearly horoscope predictions based on your zodiac sign. Get insights into your future, lucky numbers, colors, and compatibility.
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-semibold">
                  Learn More <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            <Link href="/astrology" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-pink-100 dark:border-pink-900 h-full">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">⭐</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400">
                  Astrology
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Detailed birth charts, planetary positions, transits, and compatibility analysis. Understand how cosmic forces influence your life.
                </p>
                <div className="flex items-center text-pink-600 dark:text-pink-400 font-semibold">
                  Learn More <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
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
                  Discover what your palms reveal about your personality, relationships, career, and life path through expert palm reading.
                </p>
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold">
                  Learn More <span className="ml-2 group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </Link>

            <Link href="/puja" className="group">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-yellow-100 dark:border-yellow-900 h-full">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform">🕉️</div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
                  Puja Services
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                  Traditional puja ceremonies, festival pujas, and special rituals. Connect with the divine through authentic spiritual practices.
                </p>
                <div className="flex items-center text-yellow-600 dark:text-yellow-400 font-semibold">
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

            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 shadow-lg text-white h-full flex flex-col justify-between">
              <div>
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold mb-3">
                  Complete Platform
                </h3>
                <p className="text-purple-100 mb-4 leading-relaxed">
                  Access all services in one place. Manage your spiritual journey with our comprehensive dashboard and personalized insights.
                </p>
              </div>
              <Link 
                href="/dashboard"
                className="inline-block px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                View Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features & Benefits - Full Width */}
      <section className="w-full bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Choose Naad Official
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Experience the best in spiritual guidance and mystical services
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Easy Access</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access all services from anywhere, anytime with our user-friendly platform
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Accurate Insights</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get precise predictions and readings based on ancient wisdom and modern analysis
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Secure & Private</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your data and readings are completely secure and private
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">💬</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">24/7 Support</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Get help whenever you need it with our round-the-clock customer support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials - Full Width */}
      <section className="w-full bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Real experiences from our community
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl mr-4">
                  AS
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">Anjali Sharma</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                "The daily horoscope readings are incredibly accurate and insightful. It's become an essential part of my morning routine. Highly recommended!"
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mr-4">
                  RK
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">Rajesh Kumar</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                "The palmistry reading revealed aspects of my personality I never knew. The detailed analysis helped me understand myself better. Excellent service!"
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl mr-4">
                  PP
                </div>
                <div>
                  <div className="font-bold text-lg text-gray-900 dark:text-white">Priya Patel</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">⭐⭐⭐⭐⭐</div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                "The astrology services helped me understand my life path better. The birth chart analysis was detailed and accurate. Great platform!"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Full Width */}
      <section className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Begin Your Spiritual Journey?
          </h2>
          <p className="text-xl text-purple-100 mb-10 leading-relaxed">
            Join thousands of satisfied customers who trust Naad Official for their spiritual guidance and mystical insights.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              href="/dashboard"
              className="px-10 py-4 bg-white text-purple-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
            >
              Get Started Now
            </Link>
            <Link 
              href="/horoscope"
              className="px-10 py-4 bg-purple-700/50 text-white rounded-lg font-semibold text-lg hover:bg-purple-700 transition-all transform hover:scale-105 border-2 border-white/30"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
