import Link from 'next/link';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function AstrologerDashboardHome() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Astrologer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your consultations and video meetings with clients
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-indigo-100 dark:border-indigo-900">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">📹</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Meetings</div>
            </div>
            <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">—</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled Today</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-green-100 dark:border-green-900">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">✅</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">—</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-amber-100 dark:border-amber-900">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl">⏳</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Upcoming</div>
            </div>
            <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">—</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending Sessions</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/meetings"
                className="flex flex-col items-center justify-center p-8 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border border-indigo-200 dark:border-indigo-800 hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-3">📹</div>
                <div className="text-base font-semibold text-gray-800 dark:text-white text-center">
                  Manage Meetings
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Create, schedule, and join video consultations
                </p>
              </Link>
              <Link
                href="/profile"
                className="flex flex-col items-center justify-center p-8 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all transform hover:scale-105"
              >
                <div className="text-5xl mb-3">👤</div>
                <div className="text-base font-semibold text-gray-800 dark:text-white text-center">
                  My Profile
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Update your astrologer profile details
                </p>
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
            <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
            <ul className="space-y-3 text-sm opacity-95">
              <li className="flex items-start gap-2">
                <span>1.</span>
                <span>Go to Meetings to create a new video consultation room</span>
              </li>
              <li className="flex items-start gap-2">
                <span>2.</span>
                <span>Share the guest join link with your client</span>
              </li>
              <li className="flex items-start gap-2">
                <span>3.</span>
                <span>Use the moderator link to start and manage the session</span>
              </li>
            </ul>
            <Link
              href="/meetings"
              className="inline-flex mt-6 px-5 py-2.5 bg-white text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Open Meetings →
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
