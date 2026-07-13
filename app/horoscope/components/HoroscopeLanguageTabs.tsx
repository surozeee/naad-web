'use client';

import { Globe } from 'lucide-react';
import type { HoroscopeLanguageOption } from '@/app/lib/horoscope-multilang';

interface HoroscopeLanguageTabsProps {
  languages: HoroscopeLanguageOption[];
  activeUiCode: string;
  onChange: (uiCode: string) => void;
  className?: string;
  compact?: boolean;
  /** Pills (default) or underline tab bar */
  variant?: 'pills' | 'underline';
  /** Optional count badge per language uiCode */
  counts?: Record<string, number>;
}

export function HoroscopeLanguageTabs({
  languages,
  activeUiCode,
  onChange,
  className = '',
  compact = false,
  variant = 'pills',
  counts,
}: HoroscopeLanguageTabsProps) {
  if (!languages.length) {
    return (
      <p className={`text-xs text-amber-700 dark:text-amber-300 ${className}`}>
        No active languages found. Enable languages in Master → Language.
      </p>
    );
  }

  if (variant === 'underline') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <Globe size={14} className="text-black dark:text-white shrink-0" aria-hidden />
        <div
          className="inline-flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600"
          role="tablist"
          aria-label="Language"
        >
          {languages.map((lang) => {
            const active = activeUiCode === lang.uiCode;
            const count = counts?.[lang.uiCode];
            return (
              <button
                key={lang.uiCode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(lang.uiCode)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  active
                    ? 'bg-white text-black shadow-sm border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-500'
                    : 'text-black hover:bg-white/70 dark:text-white dark:hover:bg-slate-700/80 border border-transparent'
                }`}
              >
                {lang.label}
                {count != null && count > 0 ? (
                  <span
                    className={`min-w-[1.125rem] rounded-full px-1 text-[10px] font-bold leading-4 text-center ${
                      active
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                        : 'bg-slate-200 text-black dark:bg-slate-600 dark:text-white'
                    }`}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <Globe size={compact ? 14 : 16} className="text-black dark:text-white shrink-0" aria-hidden />
      <div
        className={`inline-flex flex-wrap gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-600 ${
          compact ? '' : ''
        }`}
        role="tablist"
        aria-label="Language"
      >
        {languages.map((lang) => {
          const active = activeUiCode === lang.uiCode;
          return (
            <button
              key={lang.uiCode}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(lang.uiCode)}
              className={`font-bold transition-colors ${
                compact ? 'px-2.5 py-1 text-xs rounded-md' : 'px-3 py-1.5 text-sm rounded-md'
              } ${
                active
                  ? 'bg-white text-black shadow-sm border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-500'
                  : 'text-black hover:bg-white/70 dark:text-white dark:hover:bg-slate-700/80 border border-transparent'
              }`}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
