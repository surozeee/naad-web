import DashboardLayout from '../../components/DashboardLayout';

export default function EventPujaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Puja Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage puja events and ceremonies
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Upcoming Puja Events
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Create Event
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Diwali Puja', date: 'Oct 31, 2024', time: '6:00 PM', attendees: 150 },
              { name: 'Holi Puja', date: 'Mar 25, 2025', time: '10:00 AM', attendees: 200 },
              { name: 'Navratri Puja', date: 'Oct 3, 2024', time: '7:00 PM', attendees: 180 },
            ].map((event, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{event.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Date: {event.date}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Time: {event.time}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Attendees: {event.attendees}</p>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold">
                    Edit
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold">
                    View
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

