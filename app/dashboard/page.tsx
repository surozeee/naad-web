import DashboardLayout from '../components/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome to your dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-pink-100 dark:border-pink-900">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⭐</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Astrology</div>
            </div>
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-1">8</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Charts Generated</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-yellow-100 dark:border-yellow-900">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">🕉️</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Puja</div>
            </div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">5</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Services Booked</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Recent Activity
              </h2>
              <div className="space-y-4">
                {[
                  { icon: '⭐', title: 'Birth Chart Generated', time: '5 hours ago', type: 'Astrology' },
                  { icon: '🕉️', title: 'Puja Service Scheduled', time: '2 days ago', type: 'Puja' },
                  { icon: '🎵', title: 'Devotional Music Playlist', time: '3 days ago', type: 'Music' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <div className="text-3xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 dark:text-white">{activity.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{activity.type} • {activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <a
                  href="/astrology"
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20 border border-pink-200 dark:border-pink-800 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2">⭐</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white text-center">
                    Birth Chart
                  </div>
                </a>
                <a
                  href="/puja"
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2">🕉️</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white text-center">
                    Book Puja
                  </div>
                </a>
                <a
                  href="/music"
                  className="flex flex-col items-center justify-center p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <div className="text-4xl mb-2">🎵</div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-white text-center">
                    Listen Music
                  </div>
                </a>
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

