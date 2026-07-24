'use client';

import { useLocale } from '@/app/components/LocaleProvider';
import { EnglishDatepicker } from '@/app/components/ui/english-datepicker';
import { NepaliDatepicker } from '@/app/components/ui/nepali-datepicker';
import { CalendarModeToggle, type CalendarMode } from '@/app/components/ui/CalendarModeToggle';
import {
  isNepaliUiLanguage,
  nepaliToEnglishDigits,
} from '@/app/lib/date-bridge';
import styles from './calendar-mode-toggle.module.css';

type DateInputWithCalendarModeProps = {
  id: string;
  name?: string;
  /**
   * Date in the active `calendarMode` (AD or BS YYYY-MM-DD).
   * Convert with `toApiAdDate(value, calendarMode)` before API calls.
   */
  value: string;
  onChange: (ymd: string) => void;
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

function normalizeYmd(value: string): string {
  return nepaliToEnglishDigits((value || '').trim()).slice(0, 10);
}

export function DateInputWithCalendarMode({
  id,
  name,
  value,
  onChange,
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
    styles.themedInput,
    'w-full px-4 py-2 rounded-lg',
    error && !inlineToggle ? styles.themedInputError : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  function handleCalendarModeChange(next: CalendarMode) {
    if (next === calendarMode) return;
    // Parent converts stored dates for the new mode (supports shared toggles)
    onCalendarModeChange?.(next);
  }

  const picker =
    calendarMode === 'BS' ? (
      <NepaliDatepicker
        id={id}
        name={name}
        key={`${id}-bs-${useNepaliDigits ? 'ne' : 'en'}`}
        value={value}
        onChange={(v) => onChange(normalizeYmd(v))}
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
        value={value}
        onChange={(v) => onChange(normalizeYmd(v))}
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
            onChange={handleCalendarModeChange}
            className={styles.toggleInline}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.dateRow}>
      <CalendarModeToggle value={calendarMode} onChange={handleCalendarModeChange} />
      <div className={styles.dateInputWrap}>{picker}</div>
    </div>
  );
}
