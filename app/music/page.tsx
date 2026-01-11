import DashboardLayout from '../components/DashboardLayout';

export default function MusicPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Spiritual Music
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Immerse yourself in devotional music, mantras, and chants for spiritual upliftment
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/music/devotional" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🎵</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Devotional Music</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Soulful devotional songs
            </p>
          </a>

          <a href="/music/mantras" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🕉️</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Mantras</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Powerful mantras
            </p>
          </a>

          <a href="/music/bhajans" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🎤</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Bhajans</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Devotional hymns
            </p>
          </a>

          <a href="/music/chants" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🧘</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Chants</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Meditative chants
            </p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}
