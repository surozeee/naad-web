'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocale } from './LocaleProvider';
import { logout } from '@/app/lib/logout';
import { getPortalRoleLabel, resolveAuthRole } from '@/app/lib/menu-role';
import { useAuthProfile } from '@/app/lib/use-auth-profile';
import PublicThemeSelect from './PublicThemeSelect';

interface HeaderProps {
  onSidebarToggle: () => void;
  menuCollapsed: boolean;
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email?.trim() || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function Header({ onSidebarToggle, menuCollapsed, onMenuToggle, sidebarCollapsed }: HeaderProps) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, languages } = useLocale();
  const { profile } = useAuthProfile();

  const { displayName, displayEmail, portalRole, initials } = useMemo(() => {
    const resolved = resolveAuthRole(profile);
    const name = profile?.name?.trim();
    const email = profile?.email?.trim();
    return {
      displayName: name || email || 'User',
      displayEmail: email || '',
      portalRole: resolved.portalRole,
      initials: getInitials(name, email),
    };
  }, [profile]);

  const roleLabel = getPortalRoleLabel(portalRole);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileDropdownOpen]);

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm w-full z-40 flex sticky top-0">
      <div className="flex w-full">
        {/* First Section - Sidebar width with Naad Official */}
        <div
          className={`bg-white dark:bg-slate-800 text-slate-800 dark:text-white flex items-center transition-all duration-300 border-r border-slate-200 dark:border-slate-700 ${
            sidebarCollapsed ? 'w-20 justify-center' : 'w-[280px] px-[25px]'
          }`}
        >
          {sidebarCollapsed ? (
            <span className="text-3xl">✨</span>
          ) : (
            <Link href="/" className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center">
                <span className="text-xl text-white">💼</span>
              </div>
              <span className="text-[22px] font-bold text-inherit">
                Naad Official
              </span>
            </Link>
          )}
        </div>

        {/* Second Section - Menu and actions */}
        <div className="flex-1 flex items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onSidebarToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative inline-flex items-center min-w-[7.5rem]" title="Language">
              <span className="sr-only">Language</span>
              <select
                value={language}
                onChange={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setLanguage(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label="Language"
                className="appearance-none cursor-pointer rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-black dark:text-white font-semibold text-sm pl-2.5 pr-8 py-1.5 min-w-[7.5rem] max-w-[11rem] focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <svg
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            <PublicThemeSelect />

            <button
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Notifications"
            >
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-center p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                aria-label="User menu"
                title={displayName}
              >
                <span className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm select-none">
                  {initials}
                </span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">{displayName}</div>
                    {displayEmail && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{displayEmail}</div>
                    )}
                    <div className="mt-1 inline-flex text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      {roleLabel}
                    </div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      logout('/');
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-left"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
