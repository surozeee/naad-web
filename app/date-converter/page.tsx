'use client';

import Footer from '@/app/components/Footer';
import DateConverterWidget from '@/app/components/home/DateConverterWidget';

export default function DateConverterPage() {
  return (
    <div className="naad-site naad-horoscope-shell">
      <header className="naad-horoscope-intro">
        <h1>Date converter</h1>
        <p>
          Convert between Gregorian (A.D.) and Bikram Sambat (B.S.) with a clear month calendar view.
        </p>
      </header>
      <div className="naad-section-inner" style={{ paddingTop: '1rem', paddingBottom: '2.5rem' }}>
        <DateConverterWidget />
      </div>
      <Footer />
    </div>
  );
}
