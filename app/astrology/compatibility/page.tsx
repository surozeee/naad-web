import DashboardLayout from '../../components/DashboardLayout';

export default function CompatibilityPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Astrological Compatibility
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Check compatibility between different zodiac signs
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Select Signs
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Sign
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                  <option>Aries</option>
                  <option>Taurus</option>
                  <option>Gemini</option>
                  <option>Cancer</option>
                  <option>Leo</option>
                  <option>Virgo</option>
                  <option>Libra</option>
                  <option>Scorpio</option>
                  <option>Sagittarius</option>
                  <option>Capricorn</option>
                  <option>Aquarius</option>
                  <option>Pisces</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Second Sign
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                  <option>Aries</option>
                  <option>Taurus</option>
                  <option>Gemini</option>
                  <option>Cancer</option>
                  <option>Leo</option>
                  <option>Virgo</option>
                  <option>Libra</option>
                  <option>Scorpio</option>
                  <option>Sagittarius</option>
                  <option>Capricorn</option>
                  <option>Aquarius</option>
                  <option>Pisces</option>
                </select>
              </div>
              <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Check Compatibility
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Compatibility Result
            </h2>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">💕</div>
              <p className="text-gray-600 dark:text-gray-400">
                Select two signs to see their compatibility analysis
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

