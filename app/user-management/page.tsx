import DashboardLayout from '../components/DashboardLayout';

export default function UserManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users, roles, and permissions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <a href="/user-management/user" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Users</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage user accounts</p>
          </a>

          <a href="/user-management/role" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🎭</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Roles</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage user roles</p>
          </a>

          <a href="/user-management/permission" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🔐</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Permissions</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage permissions</p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

