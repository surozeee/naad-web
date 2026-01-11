import DashboardLayout from '../components/DashboardLayout';

export default function AstrologyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Astrology
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore the cosmic influences and planetary positions that shape your destiny
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/astrology/birth-chart" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Birth Chart</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Personalized birth chart
            </p>
          </a>

          <a href="/astrology/planets" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🪐</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Planetary Positions</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Current positions
            </p>
          </a>

          <a href="/astrology/transits" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🌌</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Transits</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Planetary transits
            </p>
          </a>

          <a href="/astrology/compatibility" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">💕</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Compatibility</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Sign compatibility
            </p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
