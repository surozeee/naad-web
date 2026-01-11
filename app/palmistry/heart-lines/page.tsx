import DashboardLayout from '../../components/DashboardLayout';

export default function HeartLinesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Heart Lines
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Discover what your heart lines reveal about your emotions, relationships, and love life
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Heart Line Analysis
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Long Heart Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A long heart line extending across the palm indicates a warm, affectionate nature and 
                strong emotional capacity. You give and receive love easily.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Straight Heart Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A straight heart line suggests a practical approach to relationships. You value stability 
                and commitment in your emotional connections.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Curved Heart Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A curved heart line indicates a romantic and idealistic nature. You are expressive with 
                your emotions and seek deep, meaningful connections.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Forked Heart Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A forked heart line suggests complexity in relationships. You may experience different 
                types of love or have varied emotional experiences throughout life.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

