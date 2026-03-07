'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { NepaliDatepicker, type NepaliDatepickerRef } from './nepali-datepicker';

export interface NepaliDateRangePickerProps {
  value?: { from?: Date; to?: Date };
  onChange: (value: { from?: Date; to?: Date }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showClearButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  modal?: boolean;
}

function convertADToBS(date: Date): string | null {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) return null;
  if (typeof window !== 'undefined') {
    try {
      const ad2bs = (window as any).adtobs || (window as any).nepaliFunction?.ad2bs;
      if (typeof ad2bs !== 'function') return null;
      const bsDate = ad2bs({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      });
      if (bsDate && typeof bsDate.year === 'number' && typeof bsDate.month === 'number' && typeof bsDate.day === 'number') {
        return `${String(bsDate.year).padStart(4, '0')}-${String(bsDate.month).padStart(2, '0')}-${String(bsDate.day).padStart(2, '0')}`;
      }
    } catch (_) {}
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const convertNepaliToEnglish = (value: string): string => {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return value.replace(/[०-९]/g, (match) => map[match] ?? match);
};

function convertBSToAD(bsDateString: string): Date | null {
  if (!bsDateString || typeof bsDateString !== 'string') return null;
  const normalized = convertNepaliToEnglish(bsDateString.trim());
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1] || '0', 10);
  const month = parseInt(match[2] || '0', 10);
  const day = parseInt(match[3] || '0', 10);
  if (typeof window !== 'undefined') {
    try {
      const bs2ad = (window as any).bs2ad || (window as any).nepaliFunction?.bs2ad;
      if (typeof bs2ad !== 'function') return null;
      const adDate = bs2ad({ year, month, day });
      if (adDate && typeof adDate === 'object' && 'year' in adDate && 'month' in adDate && 'day' in adDate) {
        return new Date(adDate.year, adDate.month - 1, adDate.day);
      }
    } catch (_) {}
  }
  return null;
}

export function NepaliDateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
  disabled = false,
  showClearButton = true,
  size = 'md',
  modal = false,
}: NepaliDateRangePickerProps) {
  const [fromBSDate, setFromBSDate] = useState<string>('');
  const [toBSDate, setToBSDate] = useState<string>('');
  const [rangeValue, setRangeValue] = useState<string>('');
  const datepickerRef = React.useRef<NepaliDatepickerRef>(null);
  const inputId = React.useId();
  const rangeSeparator = ' - ';

  useEffect(() => {
    let retryTimer: ReturnType<typeof setInterval> | undefined;
    const applyConversion = () => {
      const bsFrom = value?.from ? convertADToBS(value.from) : '';
      const bsTo = value?.to ? convertADToBS(value.to) : '';
      setFromBSDate(bsFrom || '');
      setToBSDate(bsTo || '');
      if (bsFrom && bsTo) setRangeValue(`${bsFrom}${rangeSeparator}${bsTo}`);
      else if (bsFrom) setRangeValue(bsFrom);
      else setRangeValue('');
    };
    applyConversion();
    if (typeof window !== 'undefined' && !(window as any).adtobs) {
      retryTimer = setInterval(() => {
        if ((window as any).adtobs) {
          applyConversion();
          if (retryTimer) clearInterval(retryTimer);
        }
      }, 250);
    }
    return () => { if (retryTimer) clearInterval(retryTimer); };
  }, [value]);

  const handleRangeChange = useCallback((valueString: string) => {
    setRangeValue(valueString || '');
    const normalizedValue = convertNepaliToEnglish(valueString || '');
    const parts = normalizedValue.split(rangeSeparator).map(part => part.trim()).filter(Boolean);
    const nextFrom = parts[0] || '';
    const nextTo = parts[1] || '';
    setFromBSDate(nextFrom);
    setToBSDate(nextTo);
    const fromAD = nextFrom ? convertBSToAD(nextFrom) : undefined;
    const toAD = nextTo ? convertBSToAD(nextTo) : undefined;
    onChange({ from: fromAD ?? undefined, to: toAD ?? undefined });
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFromBSDate('');
    setToBSDate('');
    setRangeValue('');
    onChange({ from: undefined, to: undefined });
    datepickerRef.current?.clear();
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'h-8 text-xs';
      case 'lg': return 'h-12 text-base';
      default: return 'h-10 text-sm';
    }
  };

  const hasValue = fromBSDate || toBSDate;

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center gap-2">
        <div className="flex-1 relative">
          <NepaliDatepicker
            key="nepali-range-picker"
            ref={datepickerRef}
            id={inputId}
            name="dateRange"
            value={rangeValue}
            onChange={handleRangeChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full',
              getSizeClasses(),
              'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100',
              fromBSDate && toBSDate && 'cursor-pointer'
            )}
            options={{
              dateFormat: 'YYYY-MM-DD',
              language: 'nepali',
              dateType: 'BS',
              showEnglishDateSubscript: true,
              autoClose: true,
              useEnglishNumbers: true,
              range: true,
              rangeSeparator,
              modal,
            }}
          />
        </div>
        {hasValue && showClearButton && !disabled && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md h-auto p-1 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            onClick={handleClear}
            aria-label="Clear date range"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {hasValue && (
        <span
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          aria-hidden
        >
          {fromBSDate && toBSDate ? '2' : '1'}
        </span>
      )}
    </div>
  );
}
