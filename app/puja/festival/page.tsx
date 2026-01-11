import DashboardLayout from '../../components/DashboardLayout';

export default function FestivalPujaPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Festival Puja
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Book and manage festival puja ceremonies
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Diwali', date: 'Oct 31, 2024', icon: '🪔' },
            { name: 'Holi', date: 'Mar 25, 2025', icon: '🎨' },
            { name: 'Navratri', date: 'Oct 3-12, 2024', icon: '🕉️' },
            { name: 'Dussehra', date: 'Oct 12, 2024', icon: '⚔️' },
            { name: 'Janmashtami', date: 'Aug 26, 2024', icon: '🕉️' },
            { name: 'Ganesh Chaturthi', date: 'Sep 7, 2024', icon: '🐘' },
          ].map((festival) => (
            <div key={festival.name} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="text-5xl mb-4 text-center">{festival.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 text-center">
                {festival.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
                {festival.date}
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Book Puja
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

