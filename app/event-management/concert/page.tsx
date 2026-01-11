import DashboardLayout from '../../components/DashboardLayout';

export default function ConcertPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Concert Events
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage concert events and performances
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Upcoming Concerts
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Create Concert
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Devotional Concert', date: 'Dec 25, 2024', time: '7:00 PM', venue: 'Main Hall', tickets: 500 },
              { name: 'Mantra Chanting', date: 'Jan 15, 2025', time: '6:00 PM', venue: 'Temple', tickets: 300 },
              { name: 'Bhajan Evening', date: 'Feb 10, 2025', time: '8:00 PM', venue: 'Auditorium', tickets: 400 },
            ].map((concert, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{concert.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Date: {concert.date}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Time: {concert.time}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Venue: {concert.venue}</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Tickets: {concert.tickets}</p>
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

