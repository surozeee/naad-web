import DashboardLayout from '../../components/DashboardLayout';

export default function DailyPujaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Daily Puja
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Schedule and manage your daily puja ceremonies
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Today's Puja Schedule
            </h2>
            <div className="space-y-4">
              {[
                { time: '6:00 AM', name: 'Morning Puja', deity: 'Ganesha' },
                { time: '12:00 PM', name: 'Midday Puja', deity: 'Lakshmi' },
                { time: '6:00 PM', name: 'Evening Puja', deity: 'Shiva' },
              ].map((puja, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{puja.name}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{puja.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Deity: {puja.deity}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Schedule New Puja
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Puja Type
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                  <option>Morning Puja</option>
                  <option>Midday Puja</option>
                  <option>Evening Puja</option>
                  <option>Special Puja</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Schedule Puja
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

