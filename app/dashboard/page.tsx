'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { getAuthProfileFromLocalStorage } from '@/app/lib/auth-storage';
import { resolveAuthRole } from '@/app/lib/menu-role';
import { useAuthProfile } from '@/app/lib/use-auth-profile';
import DashboardSkeleton from './dashboard-skeleton';

const CustomerDashboardHome = dynamic(() => import('./customer-dashboard-home'), {
  loading: () => <DashboardSkeleton />,
});

const AstrologerDashboardHome = dynamic(() => import('./astrologer-dashboard-home'), {
  loading: () => <DashboardSkeleton />,
});

const AdminDashboardHome = dynamic(() => import('./admin-dashboard-home'), {
  loading: () => <DashboardSkeleton />,
});

export default function DashboardPage() {
  const { profile, loading } = useAuthProfile();
  const storedProfile = getAuthProfileFromLocalStorage();

  const { isCustomer, isAstrologer, isAdmin } = useMemo(() => {
    const activeProfile = profile ?? storedProfile;
    const resolved = resolveAuthRole(activeProfile);
    return {
      isCustomer: resolved.isCustomer,
      isAstrologer: resolved.isAstrologer,
      isAdmin: resolved.isAdmin,
    };
  }, [profile, storedProfile]);

  if (loading) {
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
