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
  if (variant === 'underline') {
    return (
      <div className={`flex flex-wrap items-center gap-1 border-b border-slate-200 dark:border-slate-700 ${className}`}>
        <Globe size={14} className="text-slate-400 shrink-0 mr-1 mb-1.5" aria-hidden />
        {languages.map((lang) => {
          const active = activeUiCode === lang.uiCode;
          const count = counts?.[lang.uiCode];
          return (
            <button
              key={lang.uiCode}
              type="button"
              onClick={() => onChange(lang.uiCode)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {lang.label}
              {count != null && count > 0 ? (
                <span
                  className={`min-w-[1.125rem] rounded-full px-1 text-[10px] leading-4 text-center ${
                    active ? 'bg-primary/15 text-primary' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <Globe size={compact ? 14 : 16} className="text-slate-500 shrink-0" aria-hidden />
      {languages.map((lang) => (
        <button
          key={lang.uiCode}
          type="button"
          onClick={() => onChange(lang.uiCode)}
          className={`rounded-md font-medium transition-colors ${
            compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1.5 text-sm rounded-full'
          } ${
            activeUiCode === lang.uiCode
              ? 'bg-primary text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
