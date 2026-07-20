'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme, type Theme } from './ThemeProvider';

const THEME_OPTIONS: Array<{ id: Theme; label: string; title: string }> = [
  { id: 'cosmic', label: 'Cosmic', title: 'Cosmic Dark' },
  { id: 'celestial', label: 'Light', title: 'Celestial Light' },
  { id: 'divine', label: 'Divine', title: 'Divine Gold' },
];

/** Compact theme dropdown for public nav (Cosmic / Light / Divine). */
export default function PublicThemeSelect() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = THEME_OPTIONS.find((o) => o.id === theme) ?? THEME_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="naad-theme-select" ref={rootRef}>
      <button
        type="button"
        className="naad-theme-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${active.title}`}
        title={active.title}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`naad-theme-dot naad-theme-dot--${active.id}`} aria-hidden />
        <span className="naad-theme-select-label">{active.label}</span>
        <svg className="naad-theme-select-caret" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <ul className="naad-theme-select-menu" role="listbox" aria-label="Color theme">
          {THEME_OPTIONS.map((opt) => (
            <li key={opt.id} role="option" aria-selected={theme === opt.id}>
              <button
                type="button"
                className={`naad-theme-select-option${theme === opt.id ? ' is-active' : ''}`}
                onClick={() => {
                  setTheme(opt.id);
                  setOpen(false);
                }}
              >
                <span className={`naad-theme-dot naad-theme-dot--${opt.id}`} aria-hidden />
                <span>{opt.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
