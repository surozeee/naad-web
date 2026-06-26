'use client';

import { Globe } from 'lucide-react';
import type { HoroscopeLanguageOption } from '@/app/lib/horoscope-multilang';

interface HoroscopeLanguageTabsProps {
  languages: HoroscopeLanguageOption[];
  activeUiCode: string;
  onChange: (uiCode: string) => void;
  className?: string;
}

export function HoroscopeLanguageTabs({
  languages,
  activeUiCode,
  onChange,
  className = '',
}: HoroscopeLanguageTabsProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Globe size={16} className="text-slate-500 shrink-0" aria-hidden />
      {languages.map((lang) => (
        <button
          key={lang.uiCode}
          type="button"
          onClick={() => onChange(lang.uiCode)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
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
