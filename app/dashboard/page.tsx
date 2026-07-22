'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { getAuthProfileFromLocalStorage } from '@/app/lib/auth-storage';
import { resolveAuthRole } from '@/app/lib/menu-role';
import { useAuthProfile } from '@/app/lib/use-auth-profile';
import DashboardSkeleton from './dashboard-skeleton';

const CustomerDashboardHome = dynamic(() => import('./customer-dashboard-home'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

const AstrologerDashboardHome = dynamic(() => import('./astrologer-dashboard-home'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

const AdminDashboardHome = dynamic(() => import('./admin-dashboard-home'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
});

export default function DashboardPage() {
  const { profile, loading } = useAuthProfile();
  const storedProfile = getAuthProfileFromLocalStorage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isCustomer, isAstrologer, isAdmin } = useMemo(() => {
    const activeProfile = profile ?? storedProfile;
    const resolved = resolveAuthRole(activeProfile);
    return {
      isCustomer: resolved.isCustomer,
      isAstrologer: resolved.isAstrologer,
      isAdmin: resolved.isAdmin,
    };
  }, [profile, storedProfile]);

  // Avoid SSR/client tree mismatch from localStorage role + dynamic imports.
  if (!mounted || loading) {
    return <DashboardSkeleton />;
  }

  if (isCustomer) {
    return <CustomerDashboardHome />;
  }

  if (isAstrologer) {
    return <AstrologerDashboardHome />;
  }

  if (isAdmin) {
    return <AdminDashboardHome />;
  }

  return <AdminDashboardHome />;
}
