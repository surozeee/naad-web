import DashboardLayout from '../../components/DashboardLayout';

export default function LifeLinesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Life Lines
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Understand what your life lines reveal about your health, vitality, and life journey
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Life Line Analysis
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Long Life Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A long, deep life line indicates good health, vitality, and a long life. It shows strong physical 
                constitution and resilience.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Short Life Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A shorter life line doesn't necessarily mean a short life, but may indicate periods of change 
                or transformation in your life journey.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Forked Life Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A forked life line suggests multiple paths or interests in life. You may experience significant 
                changes or have diverse life experiences.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Broken Life Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Breaks in the life line may indicate periods of illness or major life changes. However, 
                overlapping lines suggest recovery and resilience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

