import DashboardLayout from '../../components/DashboardLayout';

export default function RolePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Role Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add, edit, and manage user roles
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Roles
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Add Role
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Admin', description: 'Full system access', users: 5 },
              { name: 'Moderator', description: 'Content moderation', users: 12 },
              { name: 'User', description: 'Standard user access', users: 150 },
              { name: 'Editor', description: 'Content editing', users: 8 },
              { name: 'Viewer', description: 'Read-only access', users: 25 },
            ].map((role, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{role.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{role.description}</p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mb-4">Users: {role.users}</p>
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

