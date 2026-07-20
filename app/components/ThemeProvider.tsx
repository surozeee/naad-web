'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'cosmic' | 'celestial' | 'divine';

const THEMES: Theme[] = ['cosmic', 'celestial', 'divine'];

interface ThemeContextType {
  theme: Theme;
  /** Cycles Cosmic → Celestial → Divine → Cosmic */
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const defaultThemeContext: ThemeContextType = {
  theme: 'cosmic',
  toggleTheme: () => {},
  setTheme: () => {},
  isDark: true,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

function normalizeTheme(raw: string | null): Theme {
  if (raw === 'cosmic' || raw === 'celestial' || raw === 'divine') return raw;
  // Legacy light/dark from older builds
  if (raw === 'light') return 'celestial';
  if (raw === 'dark') return 'cosmic';
  return 'cosmic';
}

export function isDarkTheme(theme: Theme): boolean {
  return theme !== 'celestial';
}

function applyThemeToDocument(theme: Theme) {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const dark = isDarkTheme(theme);
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  localStorage.setItem('theme', theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('cosmic');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initialTheme = normalizeTheme(localStorage.getItem('theme'));
    setThemeState(initialTheme);
    setMounted(true);
    applyThemeToDocument(initialTheme);
  }, []);

  useEffect(() => {
    if (mounted) {
      applyThemeToDocument(theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState((prev) => {
      const idx = THEMES.indexOf(prev);
      const next = THEMES[(idx + 1) % THEMES.length];
      applyThemeToDocument(next);
      return next;
    });
  };

  const handleSetTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyThemeToDocument(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme: handleSetTheme,
        isDark: isDarkTheme(theme),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
