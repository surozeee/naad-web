import DashboardLayout from '../../components/DashboardLayout';

export default function PermissionPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Permission Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system permissions and access controls
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Permissions
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Add Permission
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: 'View Dashboard', module: 'Dashboard', status: 'Active' },
              { name: 'Manage Users', module: 'User Management', status: 'Active' },
              { name: 'Edit Content', module: 'Content', status: 'Active' },
              { name: 'Delete Records', module: 'Data', status: 'Active' },
              { name: 'View Reports', module: 'Reports', status: 'Active' },
              { name: 'System Settings', module: 'Settings', status: 'Active' },
            ].map((permission, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">{permission.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{permission.module}</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-xs">
                    {permission.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold">
                    Edit
                  </button>
                  <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

