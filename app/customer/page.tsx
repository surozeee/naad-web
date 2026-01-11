import DashboardLayout from '../components/DashboardLayout';

export default function CustomerPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Customer Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage customer support, contacts, notifications, and email templates
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/customer/support" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🎧</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Support</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Customer support
            </p>
          </a>

          <a href="/customer/contact" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">📞</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Contact</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Contact management
            </p>
          </a>

          <a href="/customer/notification" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Notification</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Manage notifications
            </p>
          </a>

          <a href="/customer/email-template" className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
            <div className="text-5xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Email Template</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Email templates
            </p>
          </a>
        </div>
      </div>
    </DashboardLayout>
  );
}

