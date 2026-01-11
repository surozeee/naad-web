import DashboardLayout from '../components/DashboardLayout';

export default function MasterSettingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Master Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system-wide settings and configurations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="/master-setting/general" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all">
            <div className="text-5xl mb-4 text-center">⚙️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">
              General Settings
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              Country, State, District
            </p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

