'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
import { cn } from '@/app/lib/utils';

declare global {
  interface Window {
    $: any;
    jQuery: any;
  }
}

export interface EnglishDatepickerOptions {
  theme?: 'light' | 'dark' | 'blue' | 'red' | 'purple' | 'orange' | 'green';
  language?: 'nepali' | 'english';
  dateFormat?: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM/DD/YYYY';
  placeholder?: string;
  showToday?: boolean;
  autoClose?: boolean;
  modal?: boolean;
  readonly?: boolean;
  range?: boolean;
  rangeSeparator?: string;
  minDate?: string | { year: number; month: number; day: number } | null | (() => string | { year: number; month: number; day: number } | null);
  maxDate?: string | { year: number; month: number; day: number } | null | (() => string | { year: number; month: number; day: number } | null);
  disabledDates?: string[] | Array<{ year: number; month: number; day: number }>;
  disabledDateRanges?: Array<{
    start: string | { year: number; month: number; day: number };
    end: string | { year: number; month: number; day: number };
  }>;
  defaultDate?: string | { year: number; month: number; day: number } | null;
  showEnglishDateSubscript?: boolean;
  enableRangeControls?: boolean;
  getRange?: () => { start?: { year: number; month: number; day: number } | null; end?: { year: number; month: number; day: number } | null };
  onApplyRange?: () => void;
  onClearRange?: () => void;
  onSelect?: (date: { year: number; month: number; day: number }, formatted: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface EnglishDatepickerProps {
  value?: string;
  onChange?: (value: string) => void;
  onDateSelect?: (date: { year: number; month: number; day: number }, formatted: string) => void;
  options?: EnglishDatepickerOptions;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
}

export interface EnglishDatepickerRef {
  getDate: () => { year: number; month: number; day: number } | null;
  setDate: (date: string | { year: number; month: number; day: number }) => void;
  clear: () => void;
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

const EnglishDatepicker = forwardRef<EnglishDatepickerRef, EnglishDatepickerProps>(
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
    const repositionTimeoutRef = useRef<number | null>(null);
    const initRef = useRef<() => void>(() => {});

    useEffect(() => { optionsRef.current = options; }, [options]);

    useEffect(() => {
      let cssLoaded = false;
      const loadCSS = () => {
        if (cssLoaded) return;
        if (document.querySelector('link[href="/english-datepicker.css"]')) {
          cssLoaded = true;
          return;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/english-datepicker.css';
        document.head.appendChild(link);
        cssLoaded = true;
      };

      const ensureJQuery = () =>
        new Promise<void>((resolve, reject) => {
          if (window.$ || window.jQuery) {
            if (!window.jQuery) window.jQuery = window.$;
            if (!window.$) window.$ = window.jQuery;
            resolve();
            return;
          }
          const existingJQuery = document.querySelector('script[src*="jquery-3.6.0.min.js"]');
          if (existingJQuery) {
            const check = setInterval(() => {
              if (window.$ || window.jQuery) {
                clearInterval(check);
                if (!window.jQuery) window.jQuery = window.$;
                if (!window.$) window.$ = window.jQuery;
                resolve();
              }
            }, 50);
            setTimeout(() => { clearInterval(check); reject(new Error('jQuery load timeout')); }, 3000);
            return;
          }
          const jqueryScript = document.createElement('script');
          jqueryScript.src = '/jquery-3.6.0.min.js';
          jqueryScript.async = true;
          jqueryScript.onload = () => {
            if (!window.jQuery) window.jQuery = window.$;
            if (!window.$) window.$ = window.jQuery;
            resolve();
          };
          jqueryScript.onerror = () => {
            const cdnScript = document.createElement('script');
            cdnScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            cdnScript.async = true;
            cdnScript.onload = () => { if (!window.jQuery) window.jQuery = window.$; if (!window.$) window.$ = window.jQuery; resolve(); };
            cdnScript.onerror = () => reject(new Error('Failed to load jQuery'));
            document.body.appendChild(cdnScript);
          };
          document.body.appendChild(jqueryScript);
        });

      const ensureDatepickerPlugin = () =>
        new Promise<void>((resolve, reject) => {
          const hasPlugin = () => !!(window.jQuery?.fn?.englishDatepicker);
          if (hasPlugin()) { resolve(); return; }
          const existingScript = document.querySelector('script[src="/jquery-english-datepicker.js"]');
          if (existingScript && !hasPlugin()) existingScript.remove();
          const script = document.createElement('script');
          script.src = '/jquery-english-datepicker.js';
          script.async = true;
          script.onload = () => (hasPlugin() ? resolve() : reject(new Error('English datepicker plugin not available after load')));
          script.onerror = () => reject(new Error('Failed to load English datepicker script'));
          document.body.appendChild(script);
        });

      let loadAttempts = 0;
      const loadScripts = async () => {
        try {
          await ensureJQuery();
          await ensureDatepickerPlugin();
          initializeDatepicker();
        } catch (error) {
          loadAttempts += 1;
          if (loadAttempts < 3) setTimeout(() => loadScripts(), 300);
        }
      };

      const hasOverflowHiddenAncestor = (element: HTMLElement | null) => {
        let current = element?.parentElement;
        while (current && current !== document.body) {
          const style = window.getComputedStyle(current);
          if (style.overflowY === 'hidden' || style.overflowY === 'clip' || style.overflowX === 'hidden' || style.overflowX === 'clip') return true;
          current = current.parentElement;
        }
        return false;
      };

      /** z-index above .modal-overlay (999999) so datepicker appears on top when inside a modal */
      const DATEPICKER_Z_INDEX_ABOVE_MODAL = 10000000;

      const applyDatepickerPosition = () => {
        if (!inputRef.current || !datepickerInstanceRef.current?.$datepicker) return;
        const rect = inputRef.current.getBoundingClientRect();
        const $dp = datepickerInstanceRef.current.$datepicker;
        const isInDialog = !!inputRef.current.closest('[data-radix-dialog-content]') || !!inputRef.current.closest('[role="dialog"]');
        const isInModal = !!inputRef.current.closest('.modal-overlay') || !!inputRef.current.closest('.modal-content');
        const needsFixed = isInDialog || isInModal || hasOverflowHiddenAncestor(inputRef.current);
        if (needsFixed && $dp.parent()[0] !== document.body) $dp.appendTo('body');
        const zIndex = needsFixed ? DATEPICKER_Z_INDEX_ABOVE_MODAL : 10050;
        $dp.css({
          position: needsFixed ? 'fixed' : 'absolute',
          top: needsFixed ? rect.bottom + 5 : rect.bottom + window.scrollY + 5,
          left: needsFixed ? rect.left : rect.left + window.scrollX,
          zIndex,
          display: 'block',
        });
      };

      const scheduleReposition = () => {
        if (repositionTimeoutRef.current) window.clearTimeout(repositionTimeoutRef.current);
        repositionTimeoutRef.current = window.setTimeout(() => applyDatepickerPosition(), 0);
      };

      const initializeDatepicker = () => {
        if (!inputRef.current) return;
        const $ = window.$ || window.jQuery;
        if (!$ || typeof $.fn.englishDatepicker === 'undefined') {
          setTimeout(() => initializeDatepicker(), 500);
          return;
        }
        if (isInitializedRef.current && datepickerInstanceRef.current) {
          try { $(inputRef.current).englishDatepicker('destroy'); } catch (_) {}
        }
        const currentOptions = optionsRef.current;
        const defaultOptions: EnglishDatepickerOptions = {
          theme: 'light',
          language: 'english',
          dateFormat: 'YYYY-MM-DD',
          placeholder,
          showToday: true,
          autoClose: true,
          readonly: false,
          showEnglishDateSubscript: true,
          ...currentOptions,
        };
        if (value) defaultOptions.defaultDate = value;
        const originalOnSelect = defaultOptions.onSelect;
        defaultOptions.onSelect = (date: { year: number; month: number; day: number } | Array<{ value?: string }> | any, formatted?: string) => {
          try {
            const rangeSeparator = (optionsRef.current as EnglishDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
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
          } catch (_) {}
        };
        const originalOnOpen = defaultOptions.onOpen;
        defaultOptions.onOpen = () => { scheduleReposition(); originalOnOpen?.(); };
        try {
          if (!inputRef.current || !document.body.contains(inputRef.current)) {
            setTimeout(() => initializeDatepicker(), 100);
            return;
          }
          inputRef.current.setAttribute('readonly', 'readonly');
          $(inputRef.current).englishDatepicker(defaultOptions);
          datepickerInstanceRef.current = $(inputRef.current).data('englishDatepicker');
          isInitializedRef.current = true;
          scheduleReposition();
          if (value && value.trim() !== '') {
            if (inputRef.current) inputRef.current.value = value;
            if (datepickerInstanceRef.current) {
              setTimeout(() => {
                try {
                  datepickerInstanceRef.current.setDate(value);
                  if (inputRef.current && inputRef.current.value !== value) inputRef.current.value = value;
                } catch (_) {
                  if (inputRef.current) inputRef.current.value = value;
                }
              }, 50);
            }
          } else if (inputRef.current) inputRef.current.value = '';
        } catch (error) {
          console.error('Error initializing English datepicker:', error);
          setTimeout(() => { if (!isInitializedRef.current && inputRef.current) initializeDatepicker(); }, 500);
        }
      };
      initRef.current = initializeDatepicker;

      loadCSS();
      loadScripts();
      const initTimeout = window.setTimeout(() => {
        if (!isInitializedRef.current && inputRef.current && window.$ && typeof (window.$ || window.jQuery).fn?.englishDatepicker !== 'undefined')
          initializeDatepicker();
      }, 500);

      return () => {
        clearTimeout(initTimeout);
        if (repositionTimeoutRef.current) window.clearTimeout(repositionTimeoutRef.current);
        if (datepickerInstanceRef.current && window.$ && inputRef.current) {
          try {
            window.$(inputRef.current).englishDatepicker('destroy');
            datepickerInstanceRef.current = null;
            isInitializedRef.current = false;
          } catch (_) {}
        }
      };
    }, []);

    // Re-initialize when options change
    useEffect(() => {
      if (isInitializedRef.current && inputRef.current && window.$) {
        const $ = window.$ || window.jQuery;
        if (typeof $.fn.englishDatepicker !== 'undefined') {
          try {
            $(inputRef.current).englishDatepicker('destroy');
            datepickerInstanceRef.current = null;
            isInitializedRef.current = false;
            setTimeout(() => initRef.current(), 100);
          } catch (_) {}
        }
      }
    }, [JSON.stringify(options)]);

    useEffect(() => {
      const rangeSep = (optionsRef.current as EnglishDatepickerOptions | undefined)?.rangeSeparator ?? ' - ';
      const isRangeString = value && value.includes(rangeSep);
      if (value && value.trim() !== '' && isRangeString) {
        if (inputRef.current) inputRef.current.value = value;
        return;
      }
      if (datepickerInstanceRef.current && isInitializedRef.current) {
        try {
          if (value && value.trim() !== '') {
            datepickerInstanceRef.current.setDate(value);
            if (inputRef.current) inputRef.current.value = value;
          } else {
            datepickerInstanceRef.current?.clear?.();
            if (inputRef.current) inputRef.current.value = '';
          }
        } catch (_) {
          if (inputRef.current && value) inputRef.current.value = value;
        }
      } else if (value && value.trim() !== '' && inputRef.current) inputRef.current.value = value;
      else if (!value && inputRef.current) inputRef.current.value = '';
    }, [value]);

    useEffect(() => {
      if (inputRef.current && isInitializedRef.current) {
        if (disabled) inputRef.current.setAttribute('readonly', 'readonly');
        else inputRef.current.removeAttribute('readonly');
      }
    }, [disabled]);

    const openDatepicker = useCallback(() => {
      if (!datepickerInstanceRef.current) return false;
      try {
        if (typeof datepickerInstanceRef.current.show === 'function') datepickerInstanceRef.current.show();
        else if (typeof datepickerInstanceRef.current.open === 'function') datepickerInstanceRef.current.open();
        else return false;
        return true;
      } catch (_) { return false; }
    }, []);

    useImperativeHandle(ref, () => ({
      getDate: () => datepickerInstanceRef.current?.getDate() ?? null,
      setDate: (date) => datepickerInstanceRef.current?.setDate(date),
      clear: () => { datepickerInstanceRef.current?.clear?.(); onChange?.(''); },
      show: () => openDatepicker(),
      hide: () => {
        if (datepickerInstanceRef.current?.hide) datepickerInstanceRef.current.hide();
        else if (datepickerInstanceRef.current?.close) datepickerInstanceRef.current.close();
      },
      destroy: () => {
        if (inputRef.current && window.$) {
          try {
            window.$(inputRef.current).englishDatepicker('destroy');
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
        defaultValue={value || ''}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        placeholder={placeholder}
        readOnly
        disabled={disabled}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
        onFocus={(e) => {
          if (!disabled) {
            e.preventDefault();
            if (datepickerInstanceRef.current) openDatepicker();
          }
        }}
        onClick={(e) => {
          if (!disabled) {
            e.preventDefault();
            e.stopPropagation();
            openDatepicker();
          }
        }}
      />
    );
  }
);

EnglishDatepicker.displayName = 'EnglishDatepicker';
export { EnglishDatepicker };
