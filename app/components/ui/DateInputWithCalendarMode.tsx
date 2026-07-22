'use client';

import { useLocale } from '@/app/components/LocaleProvider';
import { EnglishDatepicker } from '@/app/components/ui/english-datepicker';
import { NepaliDatepicker } from '@/app/components/ui/nepali-datepicker';
import { CalendarModeToggle, type CalendarMode } from '@/app/components/ui/CalendarModeToggle';
import {
  adStringToBS,
  bsStringToAD,
  isNepaliUiLanguage,
} from '@/app/lib/date-bridge';
import styles from './calendar-mode-toggle.module.css';

type DateInputWithCalendarModeProps = {
  id: string;
  name?: string;
  /** Stored value in AD (YYYY-MM-DD) for API. */
  valueAd: string;
  onChangeAd: (adYmd: string) => void;
  calendarMode: CalendarMode;
  onCalendarModeChange?: (mode: CalendarMode) => void;
  /** When false, only the picker is shown (use a shared toggle elsewhere). Default true. */
  showToggle?: boolean;
  /** BS/AD toggle placement. `end` renders inside the input row on the right. Default `end`. */
  togglePosition?: 'start' | 'end';
  placeholder?: string;
  className?: string;
  error?: boolean;
};

export function DateInputWithCalendarMode({
  id,
  name,
  valueAd,
  onChangeAd,
  calendarMode,
  onCalendarModeChange,
  showToggle = true,
  togglePosition = 'end',
  placeholder,
  className,
  error,
}: DateInputWithCalendarModeProps) {
  const { language } = useLocale();
  const useNepaliDigits = isNepaliUiLanguage(language);
  const inlineToggle = showToggle && togglePosition === 'end';
  const inputClass = [
    'w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white',
    error && !inlineToggle ? 'border-rose-500' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const picker =
    calendarMode === 'BS' ? (
      <NepaliDatepicker
        id={id}
        name={name}
        key={`${id}-bs-${useNepaliDigits ? 'ne' : 'en'}`}
        value={valueAd ? adStringToBS(valueAd) : ''}
        onChange={(v) => onChangeAd(bsStringToAD(v))}
        placeholder={placeholder ?? 'Select date (BS)'}
        className={inputClass}
        options={{
          dateFormat: 'YYYY-MM-DD',
          language: 'nepali',
          dateType: 'BS',
          useEnglishNumbers: !useNepaliDigits,
        }}
      />
    ) : (
      <EnglishDatepicker
        id={id}
        name={name}
        value={valueAd}
        onChange={onChangeAd}
        placeholder={placeholder ?? 'Select date (AD)'}
        className={inputClass}
        options={{ dateFormat: 'YYYY-MM-DD' }}
      />
    );

  if (!showToggle && togglePosition !== 'end') {
    return <div className={styles.dateInputWrap}>{picker}</div>;
  }

  if (togglePosition === 'end') {
    return (
      <div className={`${styles.inlineGroup} ${error ? styles.inlineGroupError : ''}`.trim()}>
        <div className={styles.inlineInputWrap}>{picker}</div>
        {showToggle ? (
          <CalendarModeToggle
            value={calendarMode}
            onChange={onCalendarModeChange ?? (() => {})}
            className={styles.toggleInline}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.dateRow}>
      <CalendarModeToggle
        value={calendarMode}
        onChange={onCalendarModeChange ?? (() => {})}
      />
      <div className={styles.dateInputWrap}>{picker}</div>
    </div>
  );
}
