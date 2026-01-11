'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const submenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  // Filter menu items based on search query
  const filteredMenuItems = searchQuery.trim() === '' 
    ? menuItems 
    : menuItems.map(item => {
        const matchesLabel = item.label.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredSubmenu = item.submenu?.filter(subItem => 
          subItem.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const hasMatchingSubmenu = filteredSubmenu && filteredSubmenu.length > 0;
        
        if (matchesLabel || hasMatchingSubmenu) {
          return {
            ...item,
            submenu: matchesLabel ? item.submenu : filteredSubmenu
          };
        }
        return null;
      }).filter(item => item !== null) as typeof menuItems;

  if (collapsed) {
    return (
      <aside className="bg-[#1e293b] text-white w-20 flex flex-col fixed left-0 top-0 bottom-0 z-50 shadow-lg hidden md:flex">
        <div className="p-6 border-b border-[#374151]">
          <div className="text-center">
            <span className="text-3xl">✨</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3">
            {menuItems.map((item) => {
              const itemActive = isActive(item.href);
              return (
                <div key={item.id} className="relative group">
                  <Link
                    href={item.href}
                    className={`w-full flex items-center justify-center p-3 rounded-lg mb-1 transition-all ${
                      itemActive
                        ? 'bg-[#3b82f6] text-white'
                        : 'text-slate-300 hover:bg-[#374151] hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                  </Link>
                  <div className="absolute left-full ml-2 top-0 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="bg-[#1e293b] text-white w-[280px] flex flex-col fixed left-0 top-0 bottom-0 z-[100] shadow-lg">
      {/* Logo */}
      <div className="px-[25px] pb-[25px] pt-[25px] border-b border-[#374151] mb-[25px]">
        <h1 className="text-[22px] text-[#60a5fa] mb-1 font-semibold">
          Mystical Insights
        </h1>
        <p className="text-[#9ca3af] text-[13px]">
          Divine Guidance System
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4 border-b border-[#374151]">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#374151] text-white placeholder-[#9ca3af] rounded-lg border border-[#4b5563] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all text-sm"
          />
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible py-4">
        <div className="px-[15px] relative">
          <h3 className="text-[#9ca3af] text-[11px] uppercase tracking-wider my-5 ml-[10px]">
            MAIN NAVIGATION
          </h3>
          
          {filteredMenuItems.length === 0 && searchQuery.trim() !== '' ? (
            <div className="text-center py-8 text-[#9ca3af] text-sm">
              No results found
            </div>
          ) : (
            filteredMenuItems.map((item) => {
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              const itemActive = isActive(item.href);

              return (
                <div key={item.id} className="relative group" style={{ position: 'relative' }}>
                  {hasSubmenu ? (
                    <div 
                      className={`sidebar-menu-item ${itemActive ? 'active' : ''}`}
                      onMouseEnter={(e) => {
                        const submenu = submenuRefs.current[item.id];
                        if (submenu) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          submenu.style.left = `${rect.right + 4}px`;
                          submenu.style.top = `${rect.top - 10}px`;
                        }
                      }}
                    >
                      <span className="mr-3 w-5 text-center">{item.icon}</span>
                      <span className="flex-1 text-sm">{item.label}</span>
                      <span className="text-[10px] text-[#9ca3af]">▶</span>
                      
                      {/* Submenu */}
                      <div 
                        ref={(el) => { submenuRefs.current[item.id] = el; }}
                        className="sidebar-submenu"
                        onMouseLeave={(e) => {
                          // Keep submenu visible when hovering over it
                        }}
                      >
                        {item.submenu.map((subItem, idx) => (
                          <Link
                            key={idx}
                            href={subItem.href}
                            className={`sidebar-submenu-item ${isActive(subItem.href) ? 'active' : ''}`}
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`sidebar-menu-item ${itemActive ? 'active' : ''}`}
                    >
                      <span className="mr-3 w-5 text-center">{item.icon}</span>
                      <span className="flex-1 text-sm">{item.label}</span>
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      </nav>

      <style dangerouslySetInnerHTML={{
        __html: `
          .sidebar-menu-item {
            padding: 12px 15px;
            margin: 5px 0;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;
            position: relative;
            color: #e5e7eb;
            font-size: 14px;
          }

          .sidebar-menu-item:hover {
            background: #374151;
          }

          .sidebar-menu-item.active {
            background: #3b82f6;
          }

          .sidebar-submenu {
            position: fixed;
            background: #374151;
            min-width: 220px;
            border-radius: 8px;
            box-shadow: 5px 5px 20px rgba(0,0,0,0.2);
            display: none;
            z-index: 99999 !important;
            border: 1px solid #4b5563;
            padding: 8px 0;
            pointer-events: auto;
            margin: 0;
          }

          .sidebar-submenu::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 20px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 8px 8px 8px 0;
            border-color: transparent #374151 transparent transparent;
          }

          .sidebar-menu-item:hover .sidebar-submenu,
          .sidebar-submenu:hover {
            display: block !important;
          }

          .sidebar-submenu-item {
            padding: 12px 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            color: #e5e7eb;
            font-size: 14px;
            border-left: 3px solid transparent;
            display: block;
            text-decoration: none;
          }

          .sidebar-submenu-item:hover {
            background: #4b5563;
            color: white;
            border-left: 3px solid #3b82f6;
          }

          .sidebar-submenu-item.active {
            background: #4b5563;
            border-left: 3px solid #3b82f6;
          }

          /* Ensure parent containers don't clip submenu horizontally */
          nav {
            overflow-x: visible !important;
          }
          
          /* Keep vertical scrolling but allow horizontal overflow for submenus */
          aside > nav {
            overflow-y: auto;
            overflow-x: visible;
          }
        `
      }} />
    </aside>
  );
}
