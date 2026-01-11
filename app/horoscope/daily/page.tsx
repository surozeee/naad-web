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

        {/* Zodiac Signs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
          {[
            { sign: 'Aries', icon: '♈', date: 'Mar 21 - Apr 19', color: 'purple' },
            { sign: 'Taurus', icon: '♉', date: 'Apr 20 - May 20', color: 'green' },
            { sign: 'Gemini', icon: '♊', date: 'May 21 - Jun 20', color: 'yellow' },
            { sign: 'Cancer', icon: '♋', date: 'Jun 21 - Jul 22', color: 'silver' },
            { sign: 'Leo', icon: '♌', date: 'Jul 23 - Aug 22', color: 'orange' },
            { sign: 'Virgo', icon: '♍', date: 'Aug 23 - Sep 22', color: 'brown' },
            { sign: 'Libra', icon: '♎', date: 'Sep 23 - Oct 22', color: 'pink' },
            { sign: 'Scorpio', icon: '♏', date: 'Oct 23 - Nov 21', color: 'red' },
            { sign: 'Sagittarius', icon: '♐', date: 'Nov 22 - Dec 21', color: 'purple' },
            { sign: 'Capricorn', icon: '♑', date: 'Dec 22 - Jan 19', color: 'gray' },
            { sign: 'Aquarius', icon: '♒', date: 'Jan 20 - Feb 18', color: 'blue' },
            { sign: 'Pisces', icon: '♓', date: 'Feb 19 - Mar 20', color: 'teal' },
          ].map((zodiac) => (
            <div
              key={zodiac.sign}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="text-center">
                <div className="text-5xl mb-3">{zodiac.icon}</div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-1">
                  {zodiac.sign}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {zodiac.date}
                </p>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                  View Reading
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Today's Featured Reading */}
        <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-xl mb-8">
          <h2 className="text-3xl font-bold mb-4">Today's Featured Reading</h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-6xl">♈</span>
              <div>
                <h3 className="text-2xl font-bold">Aries</h3>
                <p className="text-purple-100">March 21 - April 19</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Overall</h4>
                <p className="text-purple-100 leading-relaxed">
                  Today brings new opportunities and fresh energy. Trust your instincts and take bold steps forward. 
                  Your natural leadership qualities will shine, and others will look to you for guidance.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-sm text-purple-100 mb-1">Lucky Number</div>
                  <div className="text-2xl font-bold">7</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-sm text-purple-100 mb-1">Lucky Color</div>
                  <div className="text-2xl font-bold">Red</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-sm text-purple-100 mb-1">Mood</div>
                  <div className="text-2xl font-bold">✨ Energetic</div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="text-sm text-purple-100 mb-1">Compatibility</div>
                  <div className="text-2xl font-bold">Leo, Sagittarius</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Insights Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Love & Relationships
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Your relationships are highlighted today. Open communication will strengthen bonds with loved ones. 
              Single Aries may find unexpected connections in social settings.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Career & Finance
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Professional opportunities are on the horizon. Your assertiveness will be rewarded. 
              Financial decisions made today will prove beneficial in the long run.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Health & Wellness
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Your energy levels are high today. Engage in physical activities to channel your natural vitality. 
              Pay attention to your body's signals and maintain balance.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Personal Growth
            </h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Today is perfect for self-reflection and setting new goals. Trust your inner wisdom and 
              embrace opportunities for personal development and spiritual growth.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

