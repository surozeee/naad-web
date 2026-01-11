import DashboardLayout from '../../components/DashboardLayout';

export default function ChantsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Chants
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Meditative chants for spiritual practice
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Om Chanting', duration: '30 min', type: 'Meditation' },
            { name: 'Aum Namah Shivaya', duration: '20 min', type: 'Shiva' },
            { name: 'Hare Krishna', duration: '25 min', type: 'Krishna' },
            { name: 'Om Mani Padme Hum', duration: '15 min', type: 'Buddhist' },
            { name: 'So Hum', duration: '30 min', type: 'Meditation' },
            { name: 'Lokah Samastah', duration: '10 min', type: 'Peace' },
          ].map((chant, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="text-5xl mb-4 text-center">🧘</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 text-center">
                {chant.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-2">
                {chant.type}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-xs text-center mb-4">
                Duration: {chant.duration}
              </p>
              <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Start Chanting
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

