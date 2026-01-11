'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  const menuItems = [
    {
      id: 'home',
      icon: '🏠',
      label: 'Home',
      href: '/',
    },
    {
      id: 'horoscope',
      icon: '♈',
      label: 'Horoscope',
      href: '/horoscope',
      submenu: [
        { label: 'Daily Horoscope', href: '/horoscope/daily' },
        { label: 'Weekly Horoscope', href: '/horoscope/weekly' },
        { label: 'Monthly Horoscope', href: '/horoscope/monthly' },
        { label: 'Yearly Horoscope', href: '/horoscope/yearly' },
      ]
    },
    {
      id: 'astrology',
      icon: '⭐',
      label: 'Astrology',
      href: '/astrology',
      submenu: [
        { label: 'Birth Chart', href: '/astrology/birth-chart' },
        { label: 'Planetary Positions', href: '/astrology/planets' },
        { label: 'Transits', href: '/astrology/transits' },
        { label: 'Compatibility', href: '/astrology/compatibility' },
      ]
    },
    {
      id: 'palmistry',
      icon: '🖐️',
      label: 'Palmistry',
      href: '/palmistry',
      submenu: [
        { label: 'Palm Reading', href: '/palmistry/reading' },
        { label: 'Life Lines', href: '/palmistry/life-lines' },
        { label: 'Heart Lines', href: '/palmistry/heart-lines' },
        { label: 'Head Lines', href: '/palmistry/head-lines' },
      ]
    },
    {
      id: 'puja',
      icon: '🕉️',
      label: 'Puja',
      href: '/puja',
      submenu: [
        { label: 'Daily Puja', href: '/puja/daily' },
        { label: 'Festival Puja', href: '/puja/festival' },
        { label: 'Special Puja', href: '/puja/special' },
        { label: 'Puja Calendar', href: '/puja/calendar' },
      ]
    },
    {
      id: 'music',
      icon: '🎵',
      label: 'Music',
      href: '/music',
      submenu: [
        { label: 'Devotional Music', href: '/music/devotional' },
        { label: 'Mantras', href: '/music/mantras' },
        { label: 'Bhajans', href: '/music/bhajans' },
        { label: 'Chants', href: '/music/chants' },
      ]
    },
  ];

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <aside 
      className={`bg-slate-800 text-white transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      } flex flex-col fixed left-0 top-0 bottom-0 z-50 shadow-lg ${
        collapsed ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        {!collapsed ? (
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Mystical Insights
            </h1>
            <p className="text-xs text-slate-400 mt-1">Divine Guidance System</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-3xl">✨</span>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3">
          {menuItems.map((item) => {
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openSubmenus.includes(item.id);
            const itemActive = isActive(item.href);

            return (
              <div key={item.id} className="relative group">
                {hasSubmenu ? (
                  <>
                    <button
                      onClick={() => toggleSubmenu(item.id)}
                      className={`w-full flex items-center px-3 py-3 rounded-lg mb-1 transition-all ${
                        itemActive
                          ? 'bg-purple-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="text-xl w-6 text-center">{item.icon}</span>
                      {!collapsed && (
                        <>
                          <span className="ml-3 flex-1 text-left">{item.label}</span>
                          <span className={`text-xs transition-transform ${isSubmenuOpen ? 'rotate-90' : ''}`}>
                            ▶
                          </span>
                        </>
                      )}
                    </button>

                    {/* Submenu */}
                    {!collapsed && isSubmenuOpen && (
                      <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-700 pl-3">
                        {item.submenu.map((subItem, idx) => (
                          <Link
                            key={idx}
                            href={subItem.href}
                            className={`block px-3 py-2 rounded-lg text-sm transition-all ${
                              isActive(subItem.href)
                                ? 'bg-purple-600/50 text-white'
                                : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`w-full flex items-center px-3 py-3 rounded-lg mb-1 transition-all ${
                      itemActive
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-xl w-6 text-center">{item.icon}</span>
                    {!collapsed && <span className="ml-3">{item.label}</span>}
                  </Link>
                )}

                {/* Tooltip when collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 top-0 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                    {hasSubmenu && item.submenu && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        {item.submenu.map((subItem, idx) => (
                          <div key={idx} className="text-xs text-slate-400 py-1">
                            {subItem.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        {!collapsed ? (
          <div className="text-xs text-slate-400 text-center">
            <p>© 2024 Mystical Insights</p>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-xl">©</span>
          </div>
        )}
      </div>
    </aside>
  );
}
