import DashboardLayout from '../../components/DashboardLayout';

export default function MantrasPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Mantras
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Chant powerful mantras for spiritual growth and inner peace
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Om Namah Shivaya', meaning: 'Salutations to Shiva', count: '108' },
            { name: 'Om Namo Narayana', meaning: 'Salutations to Vishnu', count: '108' },
            { name: 'Om Gam Ganapataye', meaning: 'Ganesha Mantra', count: '108' },
            { name: 'Om Shanti', meaning: 'Peace Mantra', count: '21' },
            { name: 'Gayatri Mantra', meaning: 'Universal Prayer', count: '108' },
            { name: 'Mahamrityunjaya', meaning: 'Victory over Death', count: '108' },
          ].map((mantra, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="text-5xl mb-4 text-center">🕉️</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 text-center">
                {mantra.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-2">
                {mantra.meaning}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-xs text-center mb-4">
                Recommended: {mantra.count} times
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

