import Link from 'next/link';
import DashboardLayout from '@/app/components/DashboardLayout';

export default function AdminDashboardHome() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Platform overview and quick access to management tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: '👥', label: 'Users', href: '/user-management/user', color: 'blue' },
            { icon: '🔮', label: 'Astrologers', href: '/user-management/astrologer', color: 'purple' },
            { icon: '📅', label: 'Events', href: '/event-management/event', color: 'green' },
            { icon: '💬', label: 'Support', href: '/support/ticket', color: 'amber' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all transform hover:scale-[1.02]"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <div className="text-lg font-semibold text-gray-800 dark:text-white">{item.label}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage →</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Management
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: '⚙️', title: 'Master Settings', href: '/master-setting/general', desc: 'Countries, districts, calendar' },
                  { icon: '🔐', title: 'Roles & Permissions', href: '/user-management/role', desc: 'Access control configuration' },
                  { icon: '📋', title: 'Menus', href: '/user-management/menu', desc: 'Navigation structure' },
                  { icon: '🎫', title: 'Tickets', href: '/support/ticket', desc: 'Customer support requests' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="text-2xl">{item.icon}</div>
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">{item.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl p-6 shadow-lg text-white">
              <h2 className="text-xl font-bold mb-4">Content Modules</h2>
              <div className="space-y-2">
                {[
                  { icon: '♈', label: 'Horoscope', href: '/horoscope' },
                  { icon: '⭐', label: 'Astrology', href: '/astrology' },
                  { icon: '🕉️', label: 'Puja', href: '/puja' },
                  { icon: '🎵', label: 'Music', href: '/music' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3">
                System
              </h2>
              <Link
                href="/settings/system-settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-xl">🔧</span>
                <span className="font-medium text-gray-800 dark:text-white">Configuration</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
