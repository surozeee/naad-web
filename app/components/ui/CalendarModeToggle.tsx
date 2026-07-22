'use client';

import type { CalendarMode } from '@/app/lib/date-bridge';
import styles from './calendar-mode-toggle.module.css';

const FLAG_AD = 'https://flagcdn.com/w40/gb.png';
const FLAG_BS = 'https://flagcdn.com/w40/np.png';

type CalendarModeToggleProps = {
  value: CalendarMode;
  onChange: (mode: CalendarMode) => void;
  className?: string;
  'aria-label'?: string;
};

export type { CalendarMode };

export function CalendarModeToggle({
  value,
  onChange,
  className,
  'aria-label': ariaLabel,
}: CalendarModeToggleProps) {
  return (
    <div
      className={`${styles.toggle} ${className ?? ''}`.trim()}
      role="group"
      aria-label={ariaLabel ?? 'Calendar type'}
    >
      <button
        type="button"
        className={`${styles.btn} ${value === 'AD' ? styles.btnActive : ''}`}
        aria-pressed={value === 'AD'}
        aria-label="Gregorian (AD)"
        title="AD"
        onClick={() => onChange('AD')}
      >
        <img src={FLAG_AD} alt="" className={styles.flag} width={18} height={12} loading="lazy" />
        <span>AD</span>
      </button>
      <button
        type="button"
        className={`${styles.btn} ${value === 'BS' ? styles.btnActive : ''}`}
        aria-pressed={value === 'BS'}
        aria-label="Bikram Sambat (BS)"
        title="BS"
        onClick={() => onChange('BS')}
      >
        <img src={FLAG_BS} alt="" className={styles.flag} width={18} height={12} loading="lazy" />
        <span>BS</span>
      </button>
    </div>
  );
}
