'use client';

import Select from 'react-select';
import { useActiveTimezones, type ActiveTimezoneOption } from '@/app/lib/use-active-timezones';
import { formatTimezoneDisplay } from '@/app/lib/timezone-options';

type Props = {
  value: string;
  onChange: (zoneId: string) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Active timezone dropdown — labels follow current UI locale (master timezone_local).
 * Value is always an IANA zone id for kundali APIs.
 */
export default function ActiveTimezoneSelect({ value, onChange, disabled, className }: Props) {
  const { options, loading, error } = useActiveTimezones();

  const selected =
    options.find((o) => o.value === value) ??
    (value
      ? ({
          value,
          label: formatTimezoneDisplay(value),
          name: value,
          code: formatTimezoneDisplay(value),
          utcOffset: '',
        } satisfies ActiveTimezoneOption)
      : null);

  const allOptions =
    selected && !options.some((o) => o.value === selected.value)
      ? [selected, ...options]
      : options;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Timezone
      </label>
      <Select<ActiveTimezoneOption>
        options={allOptions}
        value={selected}
        onChange={(opt) => onChange(opt?.value ?? '')}
        isDisabled={disabled || loading}
        isSearchable
        isClearable={false}
        placeholder={loading ? 'Loading timezones…' : 'Select timezone…'}
        classNamePrefix="selectpicker"
        className="selectpicker-wrapper"
        menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
        menuPosition="fixed"
        getOptionLabel={(o) => o.label}
        getOptionValue={(o) => o.value}
        styles={{
          control: (base) => ({
            ...base,
            minHeight: 42,
            backgroundColor: 'var(--naad-card-bg, #fff)',
            borderColor: 'var(--naad-border, #cbd5e1)',
          }),
          menuPortal: (base) => ({ ...base, zIndex: 1000000 }),
          singleValue: (base) => ({ ...base, color: 'inherit' }),
          option: (base) => ({ ...base, color: '#0f172a' }),
        }}
      />
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      {!loading && !error && options.length === 0 && (
        <p className="mt-1 text-xs text-amber-600">
          No active timezones in master. Add them under Master Setting → Timezone.
        </p>
      )}
    </div>
  );
}
