'use client';

import { useEffect, useState } from 'react';
import {
  authProfileFromUserApi,
  getAuthProfileFromLocalStorage,
  saveAuthProfileToLocalStorage,
  type StoredAuthProfile,
} from '@/app/lib/auth-storage';
import { getProfile } from '@/app/lib/profile.service';

export function useAuthProfile() {
  const [profile, setProfile] = useState<StoredAuthProfile | null>(() =>
    typeof window === 'undefined' ? null : getAuthProfileFromLocalStorage()
  );
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = getAuthProfileFromLocalStorage();
    return !(stored?.role || stored?.userType);
  });

  useEffect(() => {
    let cancelled = false;
    const stored = getAuthProfileFromLocalStorage();

    if (stored?.role || stored?.userType) {
      setProfile(stored);
      setLoading(false);
    }

    (async () => {
      try {
        const apiProfile = await getProfile();
        if (apiProfile) {
          const authProfile = authProfileFromUserApi(apiProfile);
          saveAuthProfileToLocalStorage(authProfile);
          if (!cancelled) setProfile(authProfile);
        } else if (!cancelled && !stored) {
          setProfile(null);
        }
      } catch {
        if (!cancelled && !stored) setProfile(stored);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}
