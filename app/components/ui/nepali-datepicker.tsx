'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { cn } from '@/app/lib/utils';

declare global {
  interface Window {
    $: any;
    jQuery: any;
    ad2bs?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
    bs2ad?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
    adtobs?: (date: { year: number; month: number; day: number } | string) => { year: number; month: number; day: number };
    nepaliFunction?: {
      ad2bs?: (date: { year: number; month: number; day: number } | string, format?: string) => { year: number; month: number; day: number };
      bs2ad?: (date: { year: number; month: number; day: number } | string, format?: string) => { year: number; month: number; day: number };
    };
  }
}

const LOCAL_JQUERY_URL = '/nepali-datepicker/jquery-3.6.0.min.js';
const LOCAL_PLUGIN_URL = '/nepali-datepicker/jquery-nepali-datepicker.js';
const LOCAL_CSS_URL = '/nepali-datepicker/nepali-datepicker.css';
let loaderPromise: Promise<void> | null = null;

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

const convertNepaliToEnglish = (nepaliStr: string): string => {
  if (!nepaliStr || typeof nepaliStr !== 'string') return nepaliStr || '';

  const nepaliToEnglish: { [key: string]: string } = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };

  return nepaliStr.split('').map((char) => nepaliToEnglish[char] ?? char).join('');
};

const convertEnglishToNepali = (englishStr: string): string => {
  if (!englishStr || typeof englishStr !== 'string') return englishStr || '';

  const englishToNepali: { [key: string]: string } = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  };

  return englishStr.split('').map((char) => englishToNepali[char] ?? char).join('');
};

function pluginReady(): boolean {
  const $ = typeof window !== 'undefined' ? window.$ || window.jQuery : null;
  return Boolean($ && $.fn && typeof $.fn.nepaliDatepicker !== 'undefined');
}

function attachConversionAliases(): void {
  if (!window.ad2bs) {
    if (typeof window.adtobs === 'function') {
      window.ad2bs = window.adtobs;
    } else if (typeof window.nepaliFunction?.ad2bs === 'function') {
      window.ad2bs = (date) => window.nepaliFunction!.ad2bs!(date);
    }
  }

  if (!window.adtobs && typeof window.ad2bs === 'function') {
    window.adtobs = window.ad2bs;
  }

  if (!window.bs2ad && typeof window.nepaliFunction?.bs2ad === 'function') {
    window.bs2ad = (date) => window.nepaliFunction!.bs2ad!(date);
  }
}

export function ensureOfficialLibrary(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (pluginReady()) {
    attachConversionAliases();
    return Promise.resolve();
  }
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const existingLink = document.querySelector(`link[href="${LOCAL_CSS_URL}"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LOCAL_CSS_URL;
      document.head.appendChild(link);
    }

    const waitUntilReady = () => {
      let attempts = 0;
      const interval = window.setInterval(() => {
        attempts += 1;
        if (pluginReady()) {
          clearInterval(interval);
          attachConversionAliases();
          resolve();
        } else if (attempts > 120) {
          clearInterval(interval);
          reject(new Error('Nepali datepicker plugin did not become ready'));
        }
      }, 100);
    };

    const loadDatepickerScript = () => {
      const existingScript = document.querySelector(`script[src="${LOCAL_PLUGIN_URL}"]`);
      if (existingScript) {
        waitUntilReady();
        return;
      }

      const datepickerScript = document.createElement('script');
      datepickerScript.src = LOCAL_PLUGIN_URL;
      datepickerScript.async = true;
      datepickerScript.onload = () => waitUntilReady();
      datepickerScript.onerror = () => reject(new Error('Failed to load Nepali datepicker script'));
      document.body.appendChild(datepickerScript);
    };

    if (window.$ || window.jQuery) {
      loadDatepickerScript();
      return;
    }

    const existingJQuery = document.querySelector(`script[src="${LOCAL_JQUERY_URL}"]`);
    if (existingJQuery) {
      let attempts = 0;
      const interval = window.setInterval(() => {
        attempts += 1;
        if (window.$ || window.jQuery) {
          clearInterval(interval);
          loadDatepickerScript();
        } else if (attempts > 120) {
          clearInterval(interval);
          reject(new Error('jQuery did not become ready'));
        }
      }, 100);
      return;
    }

    const jqueryScript = document.createElement('script');
    jqueryScript.src = LOCAL_JQUERY_URL;
    jqueryScript.async = true;
    jqueryScript.onerror = () => {
      jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
      jqueryScript.onerror = () => reject(new Error('Failed to load jQuery from both local and CDN'));
    };
    jqueryScript.onload = () => loadDatepickerScript();
    document.body.appendChild(jqueryScript);
  });

  return loaderPromise;
}

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

    const initializeDatepicker = () => {
      if (!inputRef.current) return;

      const $ = window.$ || window.jQuery;
      if (!$) return;

      if (typeof $.fn.nepaliDatepicker === 'undefined') {
        setTimeout(() => {
          if (typeof $.fn.nepaliDatepicker !== 'undefined') initializeDatepicker();
        }, 500);
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
      const rangeSeparator = (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
      const isRangeValue = (optionsRef.current as NepaliDatepickerOptions | undefined)?.range && processedValue.includes(rangeSeparator);

      if (processedValue && processedValue.trim() !== '' && !isRangeValue) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(processedValue)) {
          const dateParts = processedValue.split('-');
          defaultOptions.defaultDate = {
            year: parseInt(dateParts[0] || '0', 10),
            month: parseInt(dateParts[1] || '0', 10),
            day: parseInt(dateParts[2] || '0', 10),
          };
        }
      }

      const originalOnSelect = defaultOptions.onSelect;
      defaultOptions.onSelect = (
        date: { year: number; month: number; day: number } | any[],
        formatted?: string
      ) => {
        const isRangePayload = Array.isArray(date);
        const currentRangeSeparator =
          (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';

        let nextValue = formatted;

        if (isRangePayload) {
          const payload = date as Array<{ value?: string }>;
          if (payload.length >= 2) {
            const start = payload[0]?.value || '';
            const end = payload[1]?.value || '';
            nextValue = `${start}${currentRangeSeparator}${end}`.trim();
          } else if (payload.length === 1) {
            nextValue = payload[0]?.value || '';
          } else {
            nextValue = inputRef.current?.value ?? '';
          }

          if (inputRef.current && nextValue) inputRef.current.value = nextValue;
        }

        if (onChange && nextValue !== undefined) onChange(nextValue);
        if (onDateSelect && nextValue !== undefined) onDateSelect(date as any, nextValue);
        if (originalOnSelect && nextValue !== undefined) originalOnSelect(date as any, nextValue);
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

        if (processedValue && datepickerInstanceRef.current && processedValue.trim() !== '' && !isRangeValue) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(processedValue)) {
            setTimeout(() => {
              if (datepickerInstanceRef.current) {
                try {
                  const dateParts = processedValue.split('-');
                  const bsDate = {
                    year: parseInt(dateParts[0] || '0', 10),
                    month: parseInt(dateParts[1] || '0', 10),
                    day: parseInt(dateParts[2] || '0', 10),
                  };
                  datepickerInstanceRef.current.setDate(bsDate);

                  if (inputRef.current) {
                    inputRef.current.value = (optionsRef.current.useEnglishNumbers ?? true)
                      ? processedValue
                      : convertEnglishToNepali(processedValue);
                  }
                } catch (_) {
                  if (inputRef.current) {
                    inputRef.current.value = (optionsRef.current.useEnglishNumbers ?? true)
                      ? processedValue
                      : convertEnglishToNepali(processedValue);
                  }
                }
              }
            }, 100);
          }
        }
      } catch {
        setTimeout(() => {
          if (!isInitializedRef.current && inputRef.current) initializeDatepicker();
        }, 500);
      }
    };

    useEffect(() => {
      let cancelled = false;

      ensureOfficialLibrary()
        .then(() => {
          if (!cancelled) initializeDatepicker();
        })
        .catch((error) => console.error('Failed to initialize Nepali datepicker:', error));

      return () => {
        cancelled = true;
        if (datepickerInstanceRef.current && window.$ && inputRef.current) {
          try {
            window.$(inputRef.current).nepaliDatepicker('destroy');
            datepickerInstanceRef.current = null;
            isInitializedRef.current = false;
          } catch (e) {
            console.warn('Error destroying datepicker:', e);
          }
        }
      };
    }, []);

    useEffect(() => {
      if (isInitializedRef.current && inputRef.current && window.$) {
        const $ = window.$ || window.jQuery;
        if (typeof $.fn.nepaliDatepicker !== 'undefined') {
          try {
            $(inputRef.current).nepaliDatepicker('destroy');
            datepickerInstanceRef.current = null;
            isInitializedRef.current = false;
            setTimeout(() => initializeDatepicker(), 100);
          } catch (e) {
            console.warn('Error re-initializing datepicker:', e);
          }
        }
      }
    }, [JSON.stringify(options)]);

    useEffect(() => {
      const rangeSeparator = (optionsRef.current as NepaliDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
      const isRangeString = value && value.includes(rangeSeparator);

      if (value && value.trim() !== '') {
        if (isRangeString) {
          if (inputRef.current) inputRef.current.value = value;
          return;
        }

        const englishValue = convertNepaliToEnglish(value.trim());

        if (datepickerInstanceRef.current && isInitializedRef.current) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (dateRegex.test(englishValue)) {
            try {
              const [yearStr, monthStr, dayStr] = englishValue.split('-');
              const bsDate = {
                year: Number(yearStr),
                month: Number(monthStr),
                day: Number(dayStr),
              };
              const dateType = (optionsRef.current as NepaliDatepickerOptions | undefined)?.dateType;
              if (dateType === 'BS') {
                datepickerInstanceRef.current.setDate(bsDate);
              } else {
                datepickerInstanceRef.current.setDate(englishValue);
              }

              if (inputRef.current) {
                inputRef.current.value = (optionsRef.current.useEnglishNumbers ?? true)
                  ? englishValue
                  : convertEnglishToNepali(englishValue);
              }
            } catch (_) {}
          }
        }
      } else {
        if (inputRef.current) inputRef.current.value = '';
        if (datepickerInstanceRef.current && isInitializedRef.current) {
          try {
            datepickerInstanceRef.current.setDate('');
          } catch (_) {}
        }
      }
    }, [value]);

    useEffect(() => {
      if (inputRef.current && isInitializedRef.current) {
        if (disabled) inputRef.current.setAttribute('readonly', 'readonly');
        else inputRef.current.removeAttribute('readonly');
      }
    }, [disabled]);

    useImperativeHandle(ref, () => ({
      getDate: () => {
        if (datepickerInstanceRef.current) return datepickerInstanceRef.current.getDate();
        return null;
      },
      setDate: (date: string | { year: number; month: number; day: number }) => {
        if (datepickerInstanceRef.current) datepickerInstanceRef.current.setDate(date);
      },
      clear: () => {
        if (datepickerInstanceRef.current) datepickerInstanceRef.current.clear();
        if (onChange) onChange('');
      },
      show: () => {
        if (datepickerInstanceRef.current) datepickerInstanceRef.current.show();
      },
      hide: () => {
        if (datepickerInstanceRef.current) datepickerInstanceRef.current.hide();
      },
      destroy: () => {
        if (inputRef.current && window.$) {
          try {
            window.$(inputRef.current).nepaliDatepicker('destroy');
            datepickerInstanceRef.current = null;
            isInitializedRef.current = false;
          } catch (e) {
            console.warn('Error destroying datepicker:', e);
          }
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
          'custom-nepali-datepicker-input',
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onFocus={(e) => {
          if (!disabled) {
            e.preventDefault();
            if (datepickerInstanceRef.current) {
              try {
                datepickerInstanceRef.current.show();
              } catch (err) {
                console.warn('Error showing datepicker on focus:', err);
                if (!isInitializedRef.current) setTimeout(() => initializeDatepicker(), 200);
              }
            } else if (!isInitializedRef.current) {
              setTimeout(() => {
                if (inputRef.current && window.$) {
                  const $ = window.$ || window.jQuery;
                  if (typeof $.fn.nepaliDatepicker !== 'undefined') {
                    initializeDatepicker();
                    setTimeout(() => {
                      if (datepickerInstanceRef.current) datepickerInstanceRef.current.show();
                    }, 100);
                  }
                }
              }, 100);
            }
          }
        }}
        onClick={(e) => {
          if (!disabled) {
            e.preventDefault();
            e.stopPropagation();
            if (datepickerInstanceRef.current) {
              try {
                datepickerInstanceRef.current.show();
              } catch (err) {
                console.warn('Error showing datepicker on click:', err);
                if (!isInitializedRef.current) setTimeout(() => initializeDatepicker(), 200);
              }
            } else if (!isInitializedRef.current) {
              setTimeout(() => {
                if (inputRef.current && window.$) {
                  const $ = window.$ || window.jQuery;
                  if (typeof $.fn.nepaliDatepicker !== 'undefined') {
                    initializeDatepicker();
                    setTimeout(() => {
                      if (datepickerInstanceRef.current) datepickerInstanceRef.current.show();
                    }, 100);
                  }
                }
              }, 100);
            }
          }
        }}
      />
    );
  }
);

NepaliDatepicker.displayName = 'NepaliDatepicker';

export { NepaliDatepicker };
