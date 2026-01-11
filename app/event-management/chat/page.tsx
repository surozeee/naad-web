import DashboardLayout from '../../components/DashboardLayout';

export default function ChatPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Chat Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage chat conversations and messages
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Conversations
            </h2>
            <div className="space-y-2">
              {[
                { name: 'John Doe', lastMessage: 'Hello, I need help...', time: '2 min ago', unread: 2 },
                { name: 'Jane Smith', lastMessage: 'Thank you!', time: '1 hour ago', unread: 0 },
                { name: 'Bob Johnson', lastMessage: 'Can you help me?', time: '3 hours ago', unread: 1 },
              ].map((chat, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white">{chat.name}</h3>
                    {chat.unread > 0 && (
                      <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{chat.lastMessage}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{chat.time}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Chat Messages
            </h2>
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-gray-600 dark:text-gray-400">
                Select a conversation to view messages
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

