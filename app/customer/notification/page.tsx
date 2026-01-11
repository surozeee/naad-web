import DashboardLayout from '../../components/DashboardLayout';

export default function NotificationPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Notification Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage and send notifications to customers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Send Notification
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="Notification title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  placeholder="Notification message"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <button className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Send Notification
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Recent Notifications
            </h2>
            <div className="space-y-4">
              {[
                { title: 'New Puja Schedule', time: '2 hours ago', status: 'Sent' },
                { title: 'Festival Reminder', time: '1 day ago', status: 'Sent' },
                { title: 'Service Update', time: '3 days ago', status: 'Sent' },
              ].map((notif, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{notif.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{notif.time}</p>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded mt-2 inline-block">
                    {notif.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

