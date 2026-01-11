import DashboardLayout from '../../components/DashboardLayout';

export default function BhajansPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Bhajans
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Listen to devotional bhajans and hymns
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Radhe Radhe', artist: 'Krishna Bhajan', duration: '6:45' },
            { title: 'Jai Ganesh Deva', artist: 'Ganesh Bhajan', duration: '5:20' },
            { title: 'Shiv Shambho', artist: 'Shiva Bhajan', duration: '7:30' },
            { title: 'Jai Mata Di', artist: 'Durga Bhajan', duration: '8:15' },
            { title: 'Ram Siya Ram', artist: 'Ram Bhajan', duration: '6:00' },
            { title: 'Om Jai Jagdish', artist: 'Universal Bhajan', duration: '5:45' },
          ].map((bhajan, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="text-5xl mb-4 text-center">🎤</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 text-center">
                {bhajan.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-2">
                {bhajan.artist}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-xs text-center mb-4">
                {bhajan.duration}
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Play
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

