import DashboardLayout from '../../components/DashboardLayout';

export default function HeadLinesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Head Lines
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Learn what your head lines reveal about your intellect, thinking patterns, and mental abilities
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Head Line Analysis
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Long Head Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A long head line indicates strong intellectual capacity and analytical thinking. You have 
                the ability to think deeply and make well-considered decisions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Short Head Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A shorter head line suggests quick thinking and practical problem-solving. You prefer 
                action over lengthy contemplation.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Curved Head Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A curved head line indicates creativity and intuitive thinking. You combine logic with 
                imagination and think outside the box.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Straight Head Line</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                A straight head line suggests logical, methodical thinking. You approach problems 
                systematically and value facts over intuition.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

