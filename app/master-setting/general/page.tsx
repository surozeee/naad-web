import DashboardLayout from '../../components/DashboardLayout';

export default function GeneralSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            General Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage general system settings
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <a href="/master-setting/general/country" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Country</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage countries</p>
          </a>

          <a href="/master-setting/general/state" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">State</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage states</p>
          </a>

          <a href="/master-setting/general/district" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">📍</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">District</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage districts</p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

