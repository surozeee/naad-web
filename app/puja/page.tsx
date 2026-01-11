import DashboardLayout from '../components/DashboardLayout';

export default function PujaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Puja Services
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Connect with the divine through traditional puja ceremonies and rituals
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/puja/daily" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🕉️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Daily Puja</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Daily puja rituals
            </p>
          </a>

          <a href="/puja/festival" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Festival Puja</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Festival ceremonies
            </p>
          </a>

          <a href="/puja/special" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Special Puja</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Special occasions
            </p>
          </a>

          <a href="/puja/calendar" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Puja Calendar</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Upcoming dates
            </p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
