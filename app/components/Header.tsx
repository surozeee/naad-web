'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  onSidebarToggle: () => void;
  menuCollapsed: boolean;
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function Header({ onSidebarToggle, menuCollapsed, onMenuToggle, sidebarCollapsed }: HeaderProps) {
  const pathname = usePathname();

  const headerMenuItems = [
    { icon: '♈', label: 'Horoscope', href: '/horoscope' },
    { icon: '⭐', label: 'Astrology', href: '/astrology' },
    { icon: '🖐️', label: 'Palmistry', href: '/palmistry' },
    { icon: '🕉️', label: 'Puja', href: '/puja' },
    { icon: '🎵', label: 'Music', href: '/music' },
  ];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm w-full z-40 flex">
      {/* First Section - Sidebar width with Logo */}
      <div 
        className={`bg-[#1e293b] text-white flex items-center transition-all duration-300 ${
          sidebarCollapsed ? 'w-20 justify-center' : 'w-[280px] px-[25px]'
        }`}
      >
        {sidebarCollapsed ? (
          <span className="text-3xl">✨</span>
        ) : (
          <Link href="/" className="flex items-center gap-3 w-full">
            <span className="text-2xl">✨</span>
            <div className="flex flex-col">
              <span className="text-[22px] font-semibold text-[#60a5fa] leading-tight">
                Naad Official
              </span>
            </div>
          </Link>
        )}
      </div>

      {/* Second Section - Body area with collapse button */}
      <div className="flex-1 flex items-center justify-between px-6 py-3 min-h-[64px]">
        {/* Left side - Collapse button */}
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

        {/* Center - Header Menu */}
        <nav className="flex-1 flex justify-center items-center gap-2">
          {menuCollapsed ? (
            // Icons only
            <div className="flex items-center gap-3">
              {headerMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-2 rounded-lg transition-all relative group ${
                    isActive(item.href)
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400'
                  }`}
                  title={item.label}
                >
                  <span className="text-xl">{item.icon}</span>
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Full menu with labels
            <div className="flex items-center gap-1">
              {headerMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive(item.href)
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Right side - Menu toggle and user actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            aria-label={menuCollapsed ? 'Expand menu' : 'Collapse menu'}
            title={menuCollapsed ? 'Show menu labels' : 'Show icons only'}
          >
            {menuCollapsed ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </button>

          {/* User profile placeholder */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
            U
          </div>
        </div>
      </div>
    </header>
  );
}
