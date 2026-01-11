import DashboardLayout from '../../../components/DashboardLayout';

export default function StatePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            State Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add, edit, and manage states
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              States
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Add State
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">State Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Country</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 1, name: 'Maharashtra', country: 'India', status: 'Active' },
                  { id: 2, name: 'Gujarat', country: 'India', status: 'Active' },
                  { id: 3, name: 'Karnataka', country: 'India', status: 'Active' },
                ].map((state) => (
                  <tr key={state.id} className="border-b border-gray-200 dark:border-slate-700">
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{state.id}</td>
                    <td className="py-3 px-4 text-gray-800 dark:text-white font-medium">{state.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{state.country}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-sm">
                        {state.status}
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

