'use client';

import { useEffect, useState } from 'react';
import { ensureOfficialLibrary } from '@/app/components/ui/nepali-datepicker';
import { adIsoToBsIso } from '@/app/lib/horoscope-date-period';
import { useLocale } from '@/app/components/LocaleProvider';
import { localizeDigits } from '@/app/lib/nepali-digits';

/** Display API AD ISO dates as BS only (Nepali digits when UI language is Nepali). */
export function BsDateText({
  startDate,
  endDate,
  className = '',
}: {
  startDate?: string | null;
  endDate?: string | null;
  className?: string;
}) {
  const { language } = useLocale();
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
  const raw =
    !endDate || endDate === startDate
      ? startBs || '…'
      : `${startBs || '…'} → ${endBs || '…'}`;

  return <span className={className}>{localizeDigits(raw, language)}</span>;
}
