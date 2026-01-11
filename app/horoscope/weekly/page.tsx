import DashboardLayout from '../../components/DashboardLayout';

export default function WeeklyHoroscopePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Weekly Horoscope
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get your weekly horoscope predictions for all zodiac signs
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            This Week's Predictions
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'].map((sign) => (
              <div key={sign} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">{sign}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  This week brings new opportunities for growth. Focus on your goals and maintain positive energy. 
                  Important decisions may arise, so trust your intuition.
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

