import DashboardLayout from '../../components/DashboardLayout';

export default function PalmReadingPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Palm Reading
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get a comprehensive palm reading based on your palm lines and features
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Upload Your Palm Image
            </h2>
            <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🖐️</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload a clear image of your palm
              </p>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
                Choose File
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
              Reading Analysis
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Personality Traits</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your palm reveals a creative and intuitive nature with strong leadership qualities.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Life Path</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your life line indicates a long and prosperous journey with many opportunities ahead.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

