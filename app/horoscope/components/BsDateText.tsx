'use client';

import { useEffect, useState } from 'react';
import { ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { adIsoToBsIso } from '@/app/lib/horoscope-date-period';

/** Display API AD ISO dates as BS only. */
export function BsDateText({
  startDate,
  endDate,
  className = '',
}: {
  startDate?: string | null;
  endDate?: string | null;
  className?: string;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureOfficialLibrary()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!startDate) return <span className={className}>—</span>;

  const startBs = ready ? adIsoToBsIso(startDate) : '';
  const endBs = endDate && ready ? adIsoToBsIso(endDate) : '';
  const label =
    !endDate || endDate === startDate
      ? startBs || '…'
      : `${startBs || '…'} → ${endBs || '…'}`;

  return <span className={className}>{label}</span>;
}
