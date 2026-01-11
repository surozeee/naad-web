import DashboardLayout from '../../components/DashboardLayout';

export default function MonthlyHoroscopePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Monthly Horoscope
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover your monthly horoscope predictions and what the stars have in store
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Monthly Predictions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map((sign) => (
              <div key={sign} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{sign}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  This month marks a significant period of transformation. Embrace change and new beginnings. 
                  Your relationships and career will see positive developments.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

