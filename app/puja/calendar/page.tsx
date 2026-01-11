import DashboardLayout from '../../components/DashboardLayout';

export default function PujaCalendarPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Puja Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all upcoming puja dates and auspicious days
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Upcoming Puja Dates
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { date: 'Dec 25, 2024', event: 'Christmas Puja', type: 'Festival' },
              { date: 'Jan 1, 2025', event: 'New Year Puja', type: 'Special' },
              { date: 'Jan 14, 2025', event: 'Makar Sankranti', type: 'Festival' },
              { date: 'Jan 26, 2025', event: 'Republic Day Puja', type: 'Special' },
              { date: 'Feb 14, 2025', event: 'Valentine Puja', type: 'Special' },
              { date: 'Mar 8, 2025', event: 'Holi Puja', type: 'Festival' },
            ].map((event, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white">{event.event}</h3>
                  <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                    {event.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{event.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

