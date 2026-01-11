import DashboardLayout from '../../components/DashboardLayout';

export default function DevotionalMusicPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Devotional Music
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Listen to divine devotional music for spiritual upliftment
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Ganesh Aarti', artist: 'Various Artists', duration: '5:32' },
            { title: 'Shiva Stuti', artist: 'Classical', duration: '8:15' },
            { title: 'Vishnu Sahasranama', artist: 'Traditional', duration: '12:45' },
            { title: 'Lakshmi Mantra', artist: 'Devotional', duration: '6:20' },
            { title: 'Hanuman Chalisa', artist: 'Classical', duration: '7:30' },
            { title: 'Durga Stuti', artist: 'Traditional', duration: '9:10' },
          ].map((track, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <div className="text-5xl mb-4 text-center">🎵</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 text-center">
                {track.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-2">
                {track.artist}
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-xs text-center mb-4">
                {track.duration}
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

