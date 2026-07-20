'use client';

/**
 * Public horoscope readings — customer-facing, no login, no sidebar.
 */
import Footer from '@/app/components/Footer';
import HoroscopeReadingsView from './components/HoroscopeReadingsView';

export default function PublicHoroscopePage() {
  return (
    <div className="naad-site naad-horoscope-shell">
      <header className="naad-horoscope-intro">
        <h1>Horoscope</h1>
        <p>
          Professional forecasts for all twelve signs — daily, weekly, monthly, and yearly outlooks.
        </p>
      </header>
      <HoroscopeReadingsView variant="public" />
      <Footer />
    </div>
  );
}
