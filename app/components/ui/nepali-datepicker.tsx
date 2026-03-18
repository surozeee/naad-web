'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { cn } from '@/app/lib/utils';

declare global {
  interface HTMLElement {
    NepaliDatePicker?: (options?: Record<string, unknown> | string) => any;
    nepaliDatePicker?: (options?: Record<string, unknown> | string) => any;
  }

  interface Window {
    NepaliFunctions?: {
      AD2BS: (date: { year: number; month: number; day: number } | string, inputFormat?: string, outputFormat?: string) => any;
      BS2AD: (date: { year: number; month: number; day: number } | string, inputFormat?: string, outputFormat?: string) => any;
    };
    ad2bs?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
    bs2ad?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
    adtobs?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
  }
}

const OFFICIAL_JS_URL =
  'https://nepalidatepicker.sajanmaharjan.com.np/v5/nepali.datepicker/js/nepali.datepicker.v5.0.6.min.js';
const OFFICIAL_CSS_URL =
  'https://nepalidatepicker.sajanmaharjan.com.np/v5/nepali.datepicker/css/nepali.datepicker.v5.0.6.min.css';

export interface NepaliDatepickerOptions {
  theme?: 'light' | 'dark' | 'blue' | 'red' | 'purple' | 'orange' | 'green';
  language?: 'nepali' | 'english';
  dateFormat?: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM/DD/YYYY';
  placeholder?: string;
  showToday?: boolean;
  autoClose?: boolean;
  modal?: boolean;
  readonly?: boolean;
  minDate?: string | { year: number; month: number; day: number } | null;
  maxDate?: string | { year: number; month: number; day: number } | null;
  disabledDates?: string[] | Array<{ year: number; month: number; day: number }>;
  disabledDateRanges?: Array<{
    start: string | { year: number; month: number; day: number };
    end: string | { year: number; month: number; day: number };
  }>;
  defaultDate?: string | { year: number; month: number; day: number } | null;
  dateType?: 'AD' | 'BS' | null;
  showEnglishDateSubscript?: boolean;
  miniEnglishDates?: boolean;
  useEnglishNumbers?: boolean;
  range?: boolean;
  rangeSeparator?: string;
  inline?: boolean;
  container?: string;
  onSelect?: (date: { year: number; month: number; day: number } | any[], formatted?: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface NepaliDatepickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onDateSelect?: (date: { year: number; month: number; day: number } | any[], formatted: string) => void;
  options?: NepaliDatepickerOptions;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export interface NepaliDatepickerRef {
  getDate: () => { year: number; month: number; day: number } | null;
  setDate: (date: string | { year: number; month: number; day: number }) => void;
  clear: () => void;
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

const convertNepaliToEnglish = (value: string): string => {
  const map: Record<string, string> = {
    '०': '0',
    '१': '1',
    '२': '2',
    '३': '3',
    '४': '4',
    '५': '5',
    '६': '6',
    '७': '7',
    '८': '8',
    '९': '9',
  };
  return value.replace(/[०-९]/g, (match) => map[match] ?? match);
};

let loaderPromise: Promise<void> | null = null;

function toDateParts(value: { year: number; month: number; day: number } | string): { year: number; month: number; day: number } | null {
  if (typeof value === 'object' && value && typeof value.year === 'number' && typeof value.month === 'number' && typeof value.day === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const match = /^(\d{4})[-/.](\d{2})[-/.](\d{2})$/.exec(value.trim());
    if (!match) return null;
    return {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    };
  }

  return null;
}

function ensureOfficialLibrary(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.NepaliFunctions && typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.NepaliDatePicker === 'function') {
    return Promise.resolve();
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const existingCss = document.querySelector(`link[href="${OFFICIAL_CSS_URL}"]`);
    if (!existingCss) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = OFFICIAL_CSS_URL;
      document.head.appendChild(link);
    }

    const attachShims = () => {
      if (window.NepaliFunctions) {
        if (!window.ad2bs) {
          window.ad2bs = (date) => {
            const parts = toDateParts(date);
            if (!parts) return { year: NaN, month: NaN, day: NaN };
            return window.NepaliFunctions!.AD2BS(parts);
          };
        }
        if (!window.adtobs) window.adtobs = window.ad2bs;
        if (!window.bs2ad) {
          window.bs2ad = (date) => {
            const parts = toDateParts(date);
            if (!parts) return { year: NaN, month: NaN, day: NaN };
            return window.NepaliFunctions!.BS2AD(parts);
          };
        }
      }
    };

    const existingScript = document.querySelector(`script[src="${OFFICIAL_JS_URL}"]`) as HTMLScriptElement | null;
    if (existingScript) {
      const checkReady = () => {
        if (window.NepaliFunctions && typeof HTMLElement !== 'undefined' && typeof HTMLElement.prototype.NepaliDatePicker === 'function') {
          attachShims();
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
      return;
    }

    const script = document.createElement('script');
    script.src = OFFICIAL_JS_URL;
    script.async = true;
    script.onload = () => {
      attachShims();
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load official Nepali DatePicker library'));
    document.body.appendChild(script);
  });

  return loaderPromise;
}

const NepaliDatepicker = forwardRef<NepaliDatepickerRef, NepaliDatepickerProps>(
  ({ value, onChange, onDateSelect, options = {}, className, placeholder = 'Select Date', disabled = false, id, name }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const inlineHostRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<any>(null);
    const latestValueRef = useRef(value);
    const latestOptionsRef = useRef(options);

    useEffect(() => {
      latestValueRef.current = value;
      latestOptionsRef.current = options;
    }, [value, options]);

    const isInline = options.inline === true;

    const normalizedValue = useMemo(() => {
      if (!value) return '';
      return convertNepaliToEnglish(value.trim());
    }, [value]);

    const initializePicker = useCallback(async () => {
      await ensureOfficialLibrary();

      const hostElement = (isInline ? inlineHostRef.current : inputRef.current) as HTMLElement | null;
      if (!hostElement) return null;

      try {
        instanceRef.current?.destroy?.();
      } catch (_) {}

      if (isInline) hostElement.innerHTML = '';

      const effectiveOptions = latestOptionsRef.current;
      const pickerValue = normalizedValue || '';
      const pickerOptions: Record<string, unknown> = {
        dateFormat: effectiveOptions.dateFormat ?? 'YYYY-MM-DD',
        onSelect: (payload: any) => {
          const rangeSeparator = effectiveOptions.rangeSeparator ?? ' - ';
          let nextValue = '';

          if (Array.isArray(payload)) {
            nextValue = payload.map((item) => item?.value ?? '').filter(Boolean).join(rangeSeparator);
          } else if (payload?.value) {
            nextValue = String(payload.value);
          }

          onChange?.(nextValue);
          onDateSelect?.(payload as any, nextValue);
          effectiveOptions.onSelect?.(payload as any, nextValue);
        },
        onClose: () => effectiveOptions.onClose?.(),
        inline: isInline,
        container: effectiveOptions.container ?? 'body',
        range: effectiveOptions.range ?? false,
        multiple: false,
        value: pickerValue || undefined,
        language: effectiveOptions.language ?? 'nepali',
        mode: effectiveOptions.theme === 'dark' ? 'dark' : 'light',
        unicodeDate: !(effectiveOptions.useEnglishNumbers ?? true),
        miniEnglishDates: effectiveOptions.miniEnglishDates ?? effectiveOptions.showEnglishDateSubscript ?? true,
      };

      if (effectiveOptions.minDate != null) {
        pickerOptions.minDate = effectiveOptions.minDate;
      }

      if (effectiveOptions.maxDate != null) {
        pickerOptions.maxDate = effectiveOptions.maxDate;
      }

      if (disabled) {
        hostElement.setAttribute('aria-disabled', 'true');
      } else {
        hostElement.removeAttribute('aria-disabled');
      }

      if (typeof hostElement.NepaliDatePicker === 'function') {
        instanceRef.current = hostElement.NepaliDatePicker(pickerOptions);
      } else if (typeof hostElement.nepaliDatePicker === 'function') {
        instanceRef.current = hostElement.nepaliDatePicker(pickerOptions);
      }

      if (!isInline && inputRef.current) {
        inputRef.current.value = pickerValue;
      }

      return instanceRef.current;
    }, [disabled, isInline, normalizedValue, onChange, onDateSelect]);

    const openPicker = useCallback(async () => {
      if (disabled || isInline) return;

      let instance = instanceRef.current;
      if (!instance || typeof instance.showDatePicker !== 'function') {
        try {
          instance = await initializePicker();
        } catch (error) {
          console.error('Failed to initialize official NepaliDatepicker:', error);
          return;
        }
      }

      try {
        instance?.showDatePicker?.();
      } catch (error) {
        try {
          instanceRef.current?.destroy?.();
        } catch (_) {}

        instanceRef.current = null;

        try {
          const retryInstance = await initializePicker();
          retryInstance?.showDatePicker?.();
        } catch (retryError) {
          console.error('Failed to open official NepaliDatepicker:', retryError);
        }
      }
    }, [disabled, initializePicker, isInline]);

    useEffect(() => {
      let cancelled = false;

      initializePicker().catch((error) => {
        if (!cancelled) console.error('Failed to initialize official NepaliDatepicker:', error);
      });

      return () => {
        cancelled = true;
        try {
          instanceRef.current?.destroy?.();
        } catch (_) {}
      };
    }, [initializePicker]);

    useImperativeHandle(ref, () => ({
      getDate: () => null,
      setDate: (date) => {
        const hostElement = (isInline ? inlineHostRef.current : inputRef.current) as HTMLInputElement | HTMLDivElement | null;
        const nextValue = typeof date === 'string' ? date : `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
        if (hostElement instanceof HTMLInputElement) hostElement.value = nextValue;
        onChange?.(nextValue);
      },
      clear: () => {
        if (inputRef.current) inputRef.current.value = '';
        onChange?.('');
      },
      show: () => {
        try {
          instanceRef.current?.showDatePicker?.();
        } catch (_) {}
      },
      hide: () => {
        try {
          instanceRef.current?.hideDatePicker?.();
        } catch (_) {}
      },
      destroy: () => {
        try {
          instanceRef.current?.destroy?.();
        } catch (_) {}
      },
    }));

    if (isInline) {
      return (
        <div
          ref={inlineHostRef}
          id={id}
          className={cn('nepali-datepicker-inline-host w-full', className)}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onFocus={() => {
          void openPicker();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void openPicker();
        }}
      />
    );
  }
);

NepaliDatepicker.displayName = 'NepaliDatepicker';

export { NepaliDatepicker };
export { ensureOfficialLibrary };
