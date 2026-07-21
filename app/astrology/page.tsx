import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';

const ASTROLOGY_LINKS = [
  {
    href: '/astrology/birth-chart',
    icon: '⭐',
    title: 'Birth Kundali',
    description: 'Full chart with DOB, time & place — SVG, dasha, mangalik, panchanga',
  },
  {
    href: '/astrology/compatibility',
    icon: '💕',
    title: 'Kundali Matching',
    description: 'Ashtakoot guna milan for two partners with birth details',
  },
  {
    href: '/astrology/planets',
    icon: '🪐',
    title: 'Planetary Positions',
    description: 'Sun-sign guide (no DOB) plus live Swiss Ephemeris sky positions',
  },
  {
    href: '/astrology/transits',
    icon: '🌌',
    title: 'Transits',
    description: 'Current and upcoming planetary transits',
  },
  {
    href: '/astrology/zodiac-sign',
    icon: '♈',
    title: 'Zodiac Sign',
    description: 'Manage zodiac sign master data and locales (admin)',
    admin: true,
  },
] as const;

export default function AstrologyPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Astrology</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Swiss Ephemeris kundali charts, sun-sign guides, live planetary positions, and kundali
            matching — calculated in-house with custom SVG rendering.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ASTROLOGY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all text-center"
            >
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{item.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{item.description}</p>
              {'admin' in item && item.admin && (
                <span className="inline-block mt-3 text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
                  Admin
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
