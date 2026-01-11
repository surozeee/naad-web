import DashboardLayout from '../../components/DashboardLayout';

export default function UserPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add, edit, and manage user accounts
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Users
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Add User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
                  { name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Active' },
                  { name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', status: 'Inactive' },
                ].map((user, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-slate-700">
                    <td className="py-3 px-4 text-gray-800 dark:text-white font-medium">{user.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.role}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        user.status === 'Active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button className="text-purple-600 dark:text-purple-400 hover:underline">Edit</button>
                        <button className="text-red-600 dark:text-red-400 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

