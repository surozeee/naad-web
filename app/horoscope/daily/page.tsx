import DashboardLayout from '../../components/DashboardLayout';

export default function DailyHoroscopePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Daily Horoscope
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get your personalized daily horoscope reading based on your zodiac sign
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-purple-100 dark:border-purple-900">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">♈</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Daily</div>
            </div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">12K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Readings Today</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-pink-100 dark:border-pink-900">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⭐</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
            </div>
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1">200K+</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">All Time</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Zodiac Signs */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Select Your Zodiac Sign
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  { sign: 'Aries', icon: '♈', date: 'Mar 21 - Apr 19' },
                  { sign: 'Taurus', icon: '♉', date: 'Apr 20 - May 20' },
                  { sign: 'Gemini', icon: '♊', date: 'May 21 - Jun 20' },
                  { sign: 'Cancer', icon: '♋', date: 'Jun 21 - Jul 22' },
                  { sign: 'Leo', icon: '♌', date: 'Jul 23 - Aug 22' },
                  { sign: 'Virgo', icon: '♍', date: 'Aug 23 - Sep 22' },
                  { sign: 'Libra', icon: '♎', date: 'Sep 23 - Oct 22' },
                  { sign: 'Scorpio', icon: '♏', date: 'Oct 23 - Nov 21' },
                  { sign: 'Sagittarius', icon: '♐', date: 'Nov 22 - Dec 21' },
                  { sign: 'Capricorn', icon: '♑', date: 'Dec 22 - Jan 19' },
                  { sign: 'Aquarius', icon: '♒', date: 'Jan 20 - Feb 18' },
                  { sign: 'Pisces', icon: '♓', date: 'Feb 19 - Mar 20' },
                ].map((zodiac) => (
                  <button
                    key={zodiac.sign}
                    className="bg-white dark:bg-slate-700 rounded-xl p-4 shadow-md border border-gray-200 dark:border-slate-600 hover:shadow-lg transition-all cursor-pointer text-center"
                  >
                    <div className="text-4xl mb-2">{zodiac.icon}</div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                      {zodiac.sign}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {zodiac.date}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Reading */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Today's Featured Reading
              </h2>
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">♈</span>
                  <div>
                    <h3 className="text-2xl font-bold">Aries</h3>
                    <p className="text-purple-100 text-sm">March 21 - April 19</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold mb-2">Overall</h4>
                    <p className="text-purple-100 leading-relaxed text-sm">
                      Today brings new opportunities and fresh energy. Trust your instincts and take bold steps forward. 
                      Your natural leadership qualities will shine, and others will look to you for guidance.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-xs text-purple-100 mb-1">Lucky Number</div>
                      <div className="text-xl font-bold">7</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-xs text-purple-100 mb-1">Lucky Color</div>
                      <div className="text-xl font-bold">Red</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-xs text-purple-100 mb-1">Mood</div>
                      <div className="text-xl font-bold">✨ Energetic</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <div className="text-xs text-purple-100 mb-1">Compatibility</div>
                      <div className="text-xl font-bold">Leo, Sagittarius</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Today's Insights */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 shadow-lg text-white">
              <h2 className="text-2xl font-bold mb-4">Today's Insights</h2>
              <div className="space-y-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-90 mb-1">Lucky Number</div>
                  <div className="text-2xl font-bold">7</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-90 mb-1">Lucky Color</div>
                  <div className="text-2xl font-bold">Purple</div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm opacity-90 mb-1">Mood</div>
                  <div className="text-2xl font-bold">✨ Positive</div>
                </div>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Upcoming Events
              </h2>
              <div className="space-y-3">
                {[
                  { date: 'Dec 25', event: 'Festival Puja', icon: '🕉️' },
                  { date: 'Jan 1', event: 'New Year Special', icon: '⭐' },
                ].map((event, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-700">
                    <div className="text-2xl">{event.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-white text-sm">{event.event}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{event.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

