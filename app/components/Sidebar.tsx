'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Auto-expand submenus when searching
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      const matchingIds = menuItems
        .filter(item => {
          const matchesLabel = item.label.toLowerCase().includes(searchQuery.toLowerCase());
          const hasMatchingSubmenu = item.submenu?.some(subItem => 
            subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
          );
          return (matchesLabel || hasMatchingSubmenu) && item.submenu && item.submenu.length > 0;
        })
        .map(item => item.id);
      setOpenSubmenus(matchingIds);
    } else {
      setOpenSubmenus([]);
    }
  }, [searchQuery]);

  // Filter menu items based on search query
  const filteredMenuItems = searchQuery.trim() === '' 
    ? menuItems 
    : menuItems.map(item => {
        const matchesLabel = item.label.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredSubmenu = item.submenu?.filter(subItem => 
          subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const hasMatchingSubmenu = filteredSubmenu && filteredSubmenu.length > 0;
        
        // If label matches or has matching submenu, include the item
        if (matchesLabel || hasMatchingSubmenu) {
          return {
            ...item,
            submenu: matchesLabel ? item.submenu : filteredSubmenu
          };
        }
        return null;
      }).filter(item => item !== null) as typeof menuItems;

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

      {/* Search Bar */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      )}

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-3">
          {filteredMenuItems.length === 0 && searchQuery.trim() !== '' ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No results found
            </div>
          ) : (
            filteredMenuItems.map((item) => {
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
          }))}
        </div>
      </nav>
    </aside>
  );
}
