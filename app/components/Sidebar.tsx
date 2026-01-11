'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const submenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const menuItems = [
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
    {
      id: 'master-setting',
      icon: '⚙️',
      label: 'Master Setting',
      href: '/master-setting',
      submenu: [
        {
          label: 'General',
          href: '/master-setting/general',
          submenu: [
            { label: 'Country', href: '/master-setting/general/country' },
            { label: 'State', href: '/master-setting/general/state' },
            { label: 'District', href: '/master-setting/general/district' },
          ]
        },
      ]
    },
    {
      id: 'user-management',
      icon: '👥',
      label: 'User Management',
      href: '/user-management',
      submenu: [
        { label: 'User', href: '/user-management/user' },
        { label: 'Role', href: '/user-management/role' },
        { label: 'Permission', href: '/user-management/permission' },
      ]
    },
    {
      id: 'event-management',
      icon: '📅',
      label: 'Event Management',
      href: '/event-management',
      submenu: [
        { label: 'Ticketing', href: '/event-management/ticketing' },
        { label: 'Chat', href: '/event-management/chat' },
        { label: 'Puja', href: '/event-management/puja' },
        { label: 'Concert', href: '/event-management/concert' },
      ]
    },
    {
      id: 'customer',
      icon: '👤',
      label: 'Customer',
      href: '/customer',
      submenu: [
        { label: 'Support', href: '/customer/support' },
        { label: 'Contact', href: '/customer/contact' },
        { label: 'Notification', href: '/customer/notification' },
        { label: 'Email Template', href: '/customer/email-template' },
      ]
    },
  ];

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  // Filter menu items based on search query (including nested submenus) - memoized for performance
  const filteredMenuItems = useMemo(() => {
    if (searchQuery.trim() === '') {
      return menuItems;
    }
    return menuItems.map(item => {
        const matchesLabel = item.label.toLowerCase().includes(searchQuery.toLowerCase());
        const filteredSubmenu = item.submenu?.map(subItem => {
          const subMatchesLabel = subItem.label.toLowerCase().includes(searchQuery.toLowerCase());
          const filteredNestedSubmenu = 'submenu' in subItem && subItem.submenu 
            ? subItem.submenu.filter((nestedItem: { label: string; href: string }) => 
                nestedItem.label.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : undefined;
          const hasMatchingNested = filteredNestedSubmenu && filteredNestedSubmenu.length > 0;
          
          if (subMatchesLabel || hasMatchingNested) {
            return {
              ...subItem,
              submenu: subMatchesLabel && 'submenu' in subItem ? subItem.submenu : filteredNestedSubmenu
            };
          }
          return null;
        }).filter(subItem => subItem !== null);
        
        const hasMatchingSubmenu = filteredSubmenu && filteredSubmenu.length > 0;
        
        if (matchesLabel || hasMatchingSubmenu) {
          return {
            ...item,
            submenu: matchesLabel ? item.submenu : filteredSubmenu
          };
        }
        return null;
      }).filter(item => item !== null) as typeof menuItems;
  }, [searchQuery]);

  if (collapsed) {
    return (
      <aside 
        className="bg-[#1e293b] text-white w-20 flex flex-col fixed left-0 top-[64px] bottom-0 z-50 shadow-lg hidden md:flex overflow-visible"
        onClick={(e) => {
          // Prevent clicks inside sidebar from closing it
          e.stopPropagation();
        }}
      >
        <nav className="flex-1 overflow-y-auto overflow-x-visible py-4">
          <div className="px-3 relative">
            {menuItems.map((item) => {
              const itemActive = isActive(item.href);
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              return (
                <div key={item.id} className="relative group">
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={`w-full flex items-center justify-center p-3 rounded-lg mb-1 transition-all ${
                      itemActive
                        ? 'bg-[#3b82f6] text-white'
                        : 'text-slate-300 hover:bg-[#374151] hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                  </Link>
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-3 py-2 rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[9999] whitespace-nowrap">
                    <div className="font-semibold text-sm">{item.label}</div>
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
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside 
      className="bg-[#1e293b] text-white w-[280px] flex flex-col fixed left-0 top-[64px] bottom-0 z-[100] shadow-lg"
      onClick={(e) => {
        // Prevent clicks inside sidebar from closing it
        e.stopPropagation();
      }}
    >
      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible">
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

        <div className="relative">
          
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
                          submenu.style.top = `${rect.top}px`;
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
                        {item.submenu.map((subItem, idx) => {
                          const hasNestedSubmenu = 'submenu' in subItem && subItem.submenu && subItem.submenu.length > 0;
                          const subItemActive = isActive(subItem.href);
                          
                          return (
                            <div key={idx} className="relative sidebar-submenu-item-wrapper">
                              {hasNestedSubmenu ? (
                                <div 
                                  className={`sidebar-submenu-item has-children ${subItemActive ? 'active' : ''}`}
                                  onMouseEnter={(e) => {
                                    const nestedSubmenu = e.currentTarget.querySelector('.nested-submenu') as HTMLElement;
                                    if (nestedSubmenu) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      nestedSubmenu.style.left = `${rect.right + 4}px`;
                                      nestedSubmenu.style.top = `${rect.top}px`;
                                    }
                                  }}
                                >
                                  {subItem.label}
                                  <span className="text-[#9ca3af] absolute right-3">›</span>
                                  
                                  {/* Nested Submenu */}
                                  <div className="nested-submenu">
                                    {'submenu' in subItem && subItem.submenu && subItem.submenu.map((nestedItem: { label: string; href: string }, nestedIdx: number) => (
                                      <Link
                                        key={nestedIdx}
                                        href={nestedItem.href}
                                        prefetch={true}
                                        className={`nested-submenu-item ${isActive(nestedItem.href) ? 'active' : ''}`}
                                      >
                                        {nestedItem.label}
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <Link
                                  href={subItem.href}
                                  prefetch={true}
                                  className={`sidebar-submenu-item ${subItemActive ? 'active' : ''}`}
                                >
                                  {subItem.label}
                                </Link>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      prefetch={true}
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
            box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.2);
            display: none;
            z-index: 99999 !important;
            border: 1px solid #4b5563;
            pointer-events: auto;
            margin: 0;
          }

          .sidebar-submenu::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 12px;
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

          .sidebar-submenu-item-wrapper {
            position: relative;
          }

          .sidebar-submenu-item.has-children {
            padding-right: 30px;
          }

          .nested-submenu {
            position: fixed;
            background: #4b5563;
            min-width: 220px;
            border-radius: 8px;
            box-shadow: 5px 5px 20px rgba(0,0,0,0.2);
            display: none;
            z-index: 999999 !important;
            border: 1px solid #6b7280;
            pointer-events: auto;
            margin: 0;
          }

          .nested-submenu::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 12px;
            width: 0;
            height: 0;
            border-style: solid;
            border-width: 8px 8px 8px 0;
            border-color: transparent #4b5563 transparent transparent;
          }

          .sidebar-submenu-item.has-children:hover .nested-submenu,
          .nested-submenu:hover {
            display: block !important;
          }

          .nested-submenu-item {
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

          .nested-submenu-item:hover {
            background: #6b7280;
            color: white;
            border-left: 3px solid #3b82f6;
          }

          .nested-submenu-item.active {
            background: #6b7280;
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
