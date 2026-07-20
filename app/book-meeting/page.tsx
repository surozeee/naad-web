'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Footer from '@/app/components/Footer';
import { useAuthModal } from '@/app/components/AuthModalContext';

export default function BookMeetingPage() {
  const { status } = useSession();
  const authModal = useAuthModal();
  const isAuthed = status === 'authenticated';

  const handleBook = () => {
    if (isAuthed) {
      window.location.href = '/meetings';
      return;
    }
    authModal?.openLogin('/meetings');
  };

  return (
    <div className="naad-site naad-horoscope-shell">
      <header className="naad-horoscope-intro">
        <h1>Book a meeting</h1>
        <p>
          Talk with a Naad astrologer in a private video or audio session — for kundali questions,
          timing advice, or personal guidance.
        </p>
      </header>

      <div className="naad-section-inner" style={{ paddingTop: '1rem', paddingBottom: '3rem' }}>
        <div className="naad-book-grid">
          <article className="naad-book-panel">
            <h2>How it works</h2>
            <ol className="naad-book-steps">
              <li>Sign in to your Naad account</li>
              <li>Pick a time and call type (video or audio)</li>
              <li>Join the secure meeting room with your astrologer</li>
            </ol>
            <div className="naad-hero-actions" style={{ marginTop: '1.75rem' }}>
              <button type="button" className="naad-btn-primary" onClick={handleBook}>
                {isAuthed ? 'Go to meetings' : 'Sign in to book'}
              </button>
              {!isAuthed && authModal && (
                <button type="button" className="naad-btn-ghost" onClick={() => authModal.openRegister()}>
                  Create an account
                </button>
              )}
            </div>
          </article>

          <aside className="naad-book-panel naad-book-aside">
            <h2>Also explore</h2>
            <ul className="naad-book-links">
              <li>
                <Link href="/horoscope">Today&apos;s horoscope →</Link>
              </li>
              <li>
                <Link href="/date-converter">Date converter →</Link>
              </li>
            </ul>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}
