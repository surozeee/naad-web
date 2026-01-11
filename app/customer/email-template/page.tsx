import DashboardLayout from '../../components/DashboardLayout';

export default function EmailTemplatePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Email Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage email templates for customer communications
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Templates
            </h2>
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold">
              Create Template
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Welcome Email', subject: 'Welcome to Naad Official', type: 'Welcome' },
              { name: 'Puja Confirmation', subject: 'Your Puja is Confirmed', type: 'Confirmation' },
              { name: 'Payment Receipt', subject: 'Payment Received', type: 'Transaction' },
              { name: 'Event Reminder', subject: 'Upcoming Event', type: 'Reminder' },
              { name: 'Password Reset', subject: 'Reset Your Password', type: 'Security' },
              { name: 'Newsletter', subject: 'Monthly Newsletter', type: 'Newsletter' },
            ].map((template, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{template.subject}</p>
                <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded mb-4 inline-block">
                  {template.type}
                </span>
                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold">
                    Edit
                  </button>
                  <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold">
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

