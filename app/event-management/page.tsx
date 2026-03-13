import DashboardLayout from '../components/DashboardLayout';

export default function EventManagementPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Event Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage events, ticketing, and related services
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/event-management/event-category" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Event Category</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage event categories</p>
          </a>

          <a href="/event-management/event" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">📌</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Event</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Create and manage events</p>
          </a>

          <a href="/event-management/calendar" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🗓️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Calendar</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">View events by Nepali date</p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

