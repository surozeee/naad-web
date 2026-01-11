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

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <h3 className="text-white text-xl font-bold mb-4">Naad Official</h3>
              <p className="text-gray-400 mb-4 leading-relaxed">
                Your trusted platform for spiritual guidance, horoscope readings, astrology insights, and divine services.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors" aria-label="Facebook">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors" aria-label="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors" aria-label="Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/horoscope" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Horoscope
                  </Link>
                </li>
                <li>
                  <Link href="/astrology" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Astrology
                  </Link>
                </li>
                <li>
                  <Link href="/palmistry" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Palmistry
                  </Link>
                </li>
                <li>
                  <Link href="/puja" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Puja Services
                  </Link>
                </li>
                <li>
                  <Link href="/music" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Spiritual Music
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/refund" className="text-gray-400 hover:text-purple-400 transition-colors">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="text-gray-400 hover:text-purple-400 transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h3 className="text-white text-lg font-semibold mb-4">Contact Us</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:info@naadofficial.com" className="text-gray-400 hover:text-purple-400 transition-colors">
                    info@naadofficial.com
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+911234567890" className="text-gray-400 hover:text-purple-400 transition-colors">
                    +91 123 456 7890
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-400">
                    123 Spiritual Street,<br />
                    Divine City, DC 12345
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-400">
                <p>© {new Date().getFullYear()} Naad Official. All rights reserved.</p>
              </div>
              <div className="text-sm text-gray-400">
                <p>Made with ❤️ for spiritual seekers</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
