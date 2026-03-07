'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { EnglishDatepicker, type EnglishDatepickerRef } from './english-datepicker';

export interface EnglishDateRangePickerProps {
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

const RANGE_SEPARATOR = ' - ';

function formatADDate(date?: Date): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseADString(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;
  const match = dateString.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = parseInt(match[1] || '0', 10);
  const month = parseInt(match[2] || '0', 10);
  const day = parseInt(match[3] || '0', 10);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export function EnglishDateRangePicker({
  value,
  onChange,
  placeholder = 'Select date range',
  className,
  disabled = false,
  showClearButton = true,
  size = 'md',
  modal = false,
}: EnglishDateRangePickerProps) {
  const [fromADDate, setFromADDate] = useState<string>('');
  const [toADDate, setToADDate] = useState<string>('');
  const [rangeValue, setRangeValue] = useState<string>('');
  const datepickerRef = React.useRef<EnglishDatepickerRef>(null);

  useEffect(() => {
    const adFrom = value?.from ? formatADDate(value.from) : '';
    const adTo = value?.to ? formatADDate(value.to) : '';
    setFromADDate(adFrom);
    setToADDate(adTo);
    if (adFrom && adTo) setRangeValue(`${adFrom}${RANGE_SEPARATOR}${adTo}`);
    else if (adFrom) setRangeValue(adFrom);
    else setRangeValue('');
  }, [value]);

  const handleRangeChange = useCallback((valueString: string) => {
    setRangeValue(valueString || '');
    const parts = (valueString || '').split(RANGE_SEPARATOR).map(part => part.trim()).filter(Boolean);
    const nextFrom = parts[0] || '';
    const nextTo = parts[1] || '';
    setFromADDate(nextFrom);
    setToADDate(nextTo);
    const fromAD = nextFrom ? parseADString(nextFrom) : undefined;
    const toAD = nextTo ? parseADString(nextTo) : undefined;
    onChange({ from: fromAD ?? undefined, to: toAD ?? undefined });
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFromADDate('');
    setToADDate('');
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

  const hasValue = fromADDate || toADDate;

  return (
    <div className={cn('relative', className)}>
      <div className="relative flex items-center gap-2">
        <div className="flex-1 relative">
          <EnglishDatepicker
            key="english-range-picker"
            ref={datepickerRef}
            value={rangeValue}
            onChange={handleRangeChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full',
              getSizeClasses(),
              'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100',
              fromADDate && toADDate && 'cursor-pointer'
            )}
            options={{
              dateFormat: 'YYYY-MM-DD',
              language: 'english',
              autoClose: true,
              showToday: true,
              range: true,
              rangeSeparator: RANGE_SEPARATOR,
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
          {fromADDate && toADDate ? '2' : '1'}
        </span>
      )}
    </div>
  );
}
