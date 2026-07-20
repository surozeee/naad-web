'use client';

import { useLocale } from '@/app/components/LocaleProvider';

/** Public nav language select — persists to localStorage and drives Accept-Language. */
export default function PublicLanguageSelect() {
  const { language, setLanguage, languages, ready } = useLocale();

  return (
    <label className="naad-lang-select" title="Language">
      <span className="sr-only">Language</span>
      <select
        value={language}
        disabled={!ready}
        aria-label="Select language"
        onChange={(e) => setLanguage(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
      <svg className="naad-lang-caret" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}
