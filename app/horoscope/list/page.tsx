'use client';

/**
 * Authenticated horoscope view inside dashboard chrome (sidebar).
 */
import DashboardLayout from '@/app/components/DashboardLayout';
import HoroscopeReadingsView from '@/app/horoscope/components/HoroscopeReadingsView';

export default function HoroscopeListPage() {
  return (
    <DashboardLayout>
      <HoroscopeReadingsView variant="dashboard" />
    </DashboardLayout>
  );
}
