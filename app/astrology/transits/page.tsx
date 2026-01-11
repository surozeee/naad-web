import DashboardLayout from '../../components/DashboardLayout';

export default function TransitsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Planetary Transits
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track current and upcoming planetary transits and their effects
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Current Transits
          </h2>
          <div className="space-y-4">
            {[
              { planet: 'Jupiter', transit: 'Entering Aries', date: 'Dec 20, 2024', effect: 'Expansion and growth opportunities' },
              { planet: 'Saturn', transit: 'In Pisces', date: 'Ongoing', effect: 'Spiritual discipline and karmic lessons' },
              { planet: 'Mars', transit: 'Retrograde in Gemini', date: 'Jan 1 - Mar 15, 2025', effect: 'Review communication and plans' },
            ].map((transit, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{transit.planet}</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{transit.date}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{transit.transit}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{transit.effect}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

