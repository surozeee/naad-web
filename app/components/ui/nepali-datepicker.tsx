'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/app/lib/utils';

declare global {
  interface Window {
    $: any;
    jQuery: any;
    ad2bs?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
    bs2ad?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
  }
}

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
  useEnglishNumbers?: boolean;
  range?: boolean;
  rangeSeparator?: string;
  onSelect?: (date: { year: number; month: number; day: number }, formatted: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface NepaliDatepickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onDateSelect?: (date: { year: number; month: number; day: number }, formatted: string) => void;
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

const convertNepaliToEnglish = (nepaliStr: string): string => {
  if (!nepaliStr || typeof nepaliStr !== 'string') return nepaliStr || '';
  const nepaliToEnglish: { [key: string]: string } = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  return nepaliStr.split('').map(char => nepaliToEnglish[char] ?? char).join('');
};

const convertEnglishToNepali = (englishStr: string): string => {
  if (!englishStr || typeof englishStr !== 'string') return englishStr || '';
  const englishToNepali: { [key: string]: string } = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
  };
  return englishStr.split('').map(char => englishToNepali[char] ?? char).join('');
};

const NepaliDatepicker = forwardRef<NepaliDatepickerRef, NepaliDatepickerProps>(
  (
    {
      value,
      onChange,
      onDateSelect,
      options = {},
      className,
      placeholder = 'Select Date',
      disabled = false,
      id,
      name,
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const datepickerInstanceRef = useRef<any>(null);
    const isInitializedRef = useRef(false);
    const optionsRef = useRef(options);

    useEffect(() => {
      optionsRef.current = options;
    }, [options]);

    useEffect(() => {
      let cssLoaded = false;
      const loadCSS = () => {
        if (cssLoaded) return;
        if (document.querySelector('link[href="/nepali-datepicker/nepali-datepicker.css"]')) {
          cssLoaded = true;
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/nepali-datepicker/nepali-datepicker.css';
        document.head.appendChild(link);
        cssLoaded = true;
      };

      const loadDatepickerScript = () => {
        if (document.querySelector('script[src="/nepali-datepicker/jquery-nepali-datepicker.js"]')) {
          setTimeout(() => {
            if (typeof (window.$ || window.jQuery)?.fn?.nepaliDatepicker !== 'undefined') {
              initializeDatepicker();
            } else {
              setTimeout(() => initializeDatepicker(), 200);
            }
          }, 100);
          return;
        }
        const script = document.createElement('script');
        script.src = '/nepali-datepicker/jquery-nepali-datepicker.js';
        script.async = true;
        script.onload = () => setTimeout(() => initializeDatepicker(), 100);
        script.onerror = () => console.error('Failed to load Nepali datepicker script');
        document.body.appendChild(script);
      };

      const loadScripts = () => {
        if (window.$ || window.jQuery) {
          if (typeof (window.$ || window.jQuery).fn.nepaliDatepicker !== 'undefined') {
            initializeDatepicker();
            return;
          }
          loadDatepickerScript();
          return;
        }
        if (document.querySelector('script[src*="jquery"]')) {
          const check = setInterval(() => {
            if (window.$ || window.jQuery) {
              clearInterval(check);
              loadDatepickerScript();
            }
          }, 100);
          return;
        }
        const jqueryScript = document.createElement('script');
        jqueryScript.src = '/nepali-datepicker/jquery-3.6.0.min.js';
        jqueryScript.async = true;
        jqueryScript.onerror = () => {
          jqueryScript.src = '/jquery-3.6.0.min.js';
          jqueryScript.onerror = () => {
            jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            jqueryScript.onerror = () => console.error('Failed to load jQuery');
          };
        };
        jqueryScript.onload = () => loadDatepickerScript();
        document.body.appendChild(jqueryScript);
      };

      const initializeDatepicker = () => {
        if (!inputRef.current) return;
        const $ = window.$ || window.jQuery;
        if (!$ || typeof $.fn.nepaliDatepicker === 'undefined') {
          setTimeout(() => initializeDatepicker(), 500);
          return;
        }
        if (isInitializedRef.current && datepickerInstanceRef.current) {
          try {
            $(inputRef.current).nepaliDatepicker('destroy');
          } catch (_) {}
        }
        const currentOptions = optionsRef.current;
        const defaultOptions: NepaliDatepickerOptions = {
          theme: 'light',
          language: 'nepali',
          dateFormat: 'YYYY-MM-DD',
          placeholder,
          showToday: true,
          autoClose: true,
          readonly: false,
          showEnglishDateSubscript: true,
          useEnglishNumbers: true,
          range: false,
          rangeSeparator: ' - ',
          ...currentOptions,
        };
        const processedValue = value ? convertNepaliToEnglish(value.trim()) : '';
        const rangeSep = (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
        const isRangeValue = (optionsRef.current as NepaliDatepickerOptions | undefined)?.range && processedValue.includes(rangeSep);
        if (processedValue && processedValue.trim() !== '' && !isRangeValue && /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
          const [y, m, d] = processedValue.split('-');
          defaultOptions.defaultDate = { year: parseInt(y || '0', 10), month: parseInt(m || '0', 10), day: parseInt(d || '0', 10) };
        }
        const originalOnSelect = defaultOptions.onSelect;
        defaultOptions.onSelect = (date: { year: number; month: number; day: number } | any[], formatted?: string) => {
          const rangeSeparator = (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
          let nextValue = formatted;
          if (Array.isArray(date)) {
            const payload = date as Array<{ value?: string }>;
            if (payload.length >= 2) nextValue = `${payload[0]?.value || ''}${rangeSeparator}${payload[1]?.value || ''}`.trim();
            else if (payload.length === 1) nextValue = payload[0]?.value || '';
            else nextValue = inputRef.current?.value ?? '';
            if (inputRef.current && nextValue) inputRef.current.value = nextValue;
          }
          onChange?.(nextValue ?? '');
          onDateSelect?.(date as any, nextValue ?? '');
          originalOnSelect?.(date as any, nextValue ?? '');
        };
        try {
          if (!inputRef.current || !document.body.contains(inputRef.current)) {
            setTimeout(() => initializeDatepicker(), 100);
            return;
          }
          inputRef.current.setAttribute('readonly', 'readonly');
          $(inputRef.current).nepaliDatepicker(defaultOptions);
          datepickerInstanceRef.current = $(inputRef.current).data('nepaliDatepicker');
          isInitializedRef.current = true;
          if (processedValue && datepickerInstanceRef.current && processedValue.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
            setTimeout(() => {
              if (datepickerInstanceRef.current && inputRef.current) {
                try {
                  const [y, m, d] = processedValue.split('-');
                  datepickerInstanceRef.current.setDate({ year: parseInt(y || '0', 10), month: parseInt(m || '0', 10), day: parseInt(d || '0', 10) });
                  inputRef.current.value = (optionsRef.current as NepaliDatepickerOptions | undefined)?.useEnglishNumbers !== false ? processedValue : convertEnglishToNepali(processedValue);
                } catch (_) {
                  inputRef.current.value = processedValue;
                }
              }
            }, 100);
          }
        } catch (error) {
          console.error('Error initializing Nepali datepicker:', error);
          setTimeout(() => { if (!isInitializedRef.current && inputRef.current) initializeDatepicker(); }, 500);
        }
      };

      loadCSS();
      loadScripts();

      return () => {
        if (datepickerInstanceRef.current && window.$ && inputRef.current) {
          try {
            window.$(inputRef.current).nepaliDatepicker('destroy');
            datepickerInstanceRef.current = null;
            isInitializedRef.current = false;
          } catch (_) {}
        }
      };
    }, []);

    useEffect(() => {
      if (!isInitializedRef.current || !inputRef.current || !window.$) return;
      const $ = window.$ || window.jQuery;
      if (typeof $.fn.nepaliDatepicker === 'undefined') return;
      try {
        $(inputRef.current).nepaliDatepicker('destroy');
        datepickerInstanceRef.current = null;
        isInitializedRef.current = false;
        setTimeout(() => initializeDatepicker(), 100);
      } catch (_) {}
    }, [JSON.stringify(options)]);

    const initializeDatepicker = () => {
      if (!inputRef.current) return;
      const $ = window.$ || window.jQuery;
      if (!$ || typeof $.fn.nepaliDatepicker === 'undefined') return;
      if (isInitializedRef.current && datepickerInstanceRef.current) {
        try {
          $(inputRef.current).nepaliDatepicker('destroy');
        } catch (_) {}
      }
      const currentOptions = optionsRef.current;
      const defaultOptions: NepaliDatepickerOptions = {
        theme: 'light',
        language: 'nepali',
        dateFormat: 'YYYY-MM-DD',
        placeholder,
        showToday: true,
        autoClose: true,
        readonly: false,
        showEnglishDateSubscript: true,
        useEnglishNumbers: true,
        range: false,
        rangeSeparator: ' - ',
        ...currentOptions,
      };
      const processedValue = value ? convertNepaliToEnglish(value.trim()) : '';
      const rangeSep = (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
      const isRangeValue = (optionsRef.current as NepaliDatepickerOptions | undefined)?.range && processedValue.includes(rangeSep);
      if (processedValue && processedValue.trim() !== '' && !isRangeValue && /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
        const [y, m, d] = processedValue.split('-');
        defaultOptions.defaultDate = { year: parseInt(y || '0', 10), month: parseInt(m || '0', 10), day: parseInt(d || '0', 10) };
      }
      const originalOnSelect = defaultOptions.onSelect;
      defaultOptions.onSelect = (date: { year: number; month: number; day: number } | any[], formatted?: string) => {
        const rangeSeparator = (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
        let nextValue = formatted;
        if (Array.isArray(date)) {
          const payload = date as Array<{ value?: string }>;
          if (payload.length >= 2) nextValue = `${payload[0]?.value || ''}${rangeSeparator}${payload[1]?.value || ''}`.trim();
          else if (payload.length === 1) nextValue = payload[0]?.value || '';
          else nextValue = inputRef.current?.value ?? '';
          if (inputRef.current && nextValue) inputRef.current.value = nextValue;
        }
        onChange?.(nextValue ?? '');
        onDateSelect?.(date as any, nextValue ?? '');
        originalOnSelect?.(date as any, nextValue ?? '');
      };
      try {
        if (!inputRef.current || !document.body.contains(inputRef.current)) return;
        inputRef.current.setAttribute('readonly', 'readonly');
        $(inputRef.current).nepaliDatepicker(defaultOptions);
        datepickerInstanceRef.current = $(inputRef.current).data('nepaliDatepicker');
        isInitializedRef.current = true;
        if (processedValue && datepickerInstanceRef.current && processedValue.trim() !== '' && /^\d{4}-\d{2}-\d{2}$/.test(processedValue)) {
          setTimeout(() => {
            if (datepickerInstanceRef.current && inputRef.current) {
              try {
                const [y, m, d] = processedValue.split('-');
                datepickerInstanceRef.current.setDate({ year: parseInt(y || '0', 10), month: parseInt(m || '0', 10), day: parseInt(d || '0', 10) });
                inputRef.current.value = (optionsRef.current as NepaliDatepickerOptions | undefined)?.useEnglishNumbers !== false ? processedValue : convertEnglishToNepali(processedValue);
              } catch (_) {
                inputRef.current.value = processedValue;
              }
            }
          }, 100);
        }
      } catch (error) {
        console.error('Error initializing Nepali datepicker:', error);
      }
    };

    useEffect(() => {
      const rangeSep = (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
      const isRangeString = value && value.includes(rangeSep);
      if (value && value.trim() !== '') {
        if (isRangeString && inputRef.current) {
          inputRef.current.value = value;
          return;
        }
        const englishValue = convertNepaliToEnglish(value.trim());
        if (datepickerInstanceRef.current && isInitializedRef.current && /^\d{4}-\d{2}-\d{2}$/.test(englishValue)) {
          try {
            const [yearStr, monthStr, dayStr] = englishValue.split('-');
            const bsDate = { year: Number(yearStr), month: Number(monthStr), day: Number(dayStr) };
            const dateType = (optionsRef.current as NepaliDatepickerOptions | undefined)?.dateType;
            datepickerInstanceRef.current.setDate(dateType === 'BS' ? bsDate : englishValue);
            if (!(optionsRef.current as NepaliDatepickerOptions | undefined)?.useEnglishNumbers && inputRef.current) {
              inputRef.current.value = convertEnglishToNepali(englishValue);
            }
          } catch (_) {}
        }
      } else {
        if (inputRef.current) inputRef.current.value = '';
        if (datepickerInstanceRef.current && isInitializedRef.current) try { datepickerInstanceRef.current.setDate(''); } catch (_) {}
      }
    }, [value]);

    useEffect(() => {
      if (inputRef.current && isInitializedRef.current) {
        if (disabled) inputRef.current.setAttribute('readonly', 'readonly');
        else inputRef.current.removeAttribute('readonly');
      }
    }, [disabled]);

    useImperativeHandle(ref, () => ({
      getDate: () => datepickerInstanceRef.current?.getDate() ?? null,
      setDate: (date) => datepickerInstanceRef.current?.setDate(date),
      clear: () => { datepickerInstanceRef.current?.clear(); onChange?.(''); },
      show: () => datepickerInstanceRef.current?.show(),
      hide: () => datepickerInstanceRef.current?.hide(),
      destroy: () => {
        if (inputRef.current && window.$) {
          try {
            window.$(inputRef.current).nepaliDatepicker('destroy');
            datepickerInstanceRef.current = null;
            isInitializedRef.current = false;
          } catch (_) {}
        }
      },
    }));

    return (
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onFocus={(e) => {
          if (disabled) return;
          e.preventDefault();
          if (datepickerInstanceRef.current) {
            try { datepickerInstanceRef.current.show(); } catch (_) {}
          } else {
            setTimeout(() => {
              if (inputRef.current && (window.$ || window.jQuery) && typeof (window.$ || window.jQuery).fn?.nepaliDatepicker !== 'undefined') {
                initializeDatepicker();
                setTimeout(() => datepickerInstanceRef.current?.show(), 100);
              }
            }, 100);
          }
        }}
        onClick={(e) => {
          if (disabled) return;
          e.preventDefault();
          e.stopPropagation();
          if (datepickerInstanceRef.current) {
            try { datepickerInstanceRef.current.show(); } catch (_) {}
          } else {
            setTimeout(() => {
              if (inputRef.current && (window.$ || window.jQuery) && typeof (window.$ || window.jQuery).fn?.nepaliDatepicker !== 'undefined') {
                initializeDatepicker();
                setTimeout(() => datepickerInstanceRef.current?.show(), 100);
              }
            }, 100);
          }
        }}
      />
    );
  }
);

NepaliDatepicker.displayName = 'NepaliDatepicker';
export { NepaliDatepicker };
