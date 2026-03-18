'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { getProfile } from '@/app/lib/profile.service';
import type { MenuResponse } from '@/app/lib/user-api.types';

interface SidebarProps {
  collapsed: boolean;
  onCollapseToggle?: () => void;
}

export type SidebarMenuItem = {
  id: string;
  icon: string;
  label: string;
  href: string;
  submenu?: Array<{ label: string; href: string; submenu?: Array<{ label: string; href: string }> }>;
};

const HOVER_CLOSE_DELAY_MS = 200;

/** Menus shown only to CUSTOMER role (Horoscope, Astrology, Puja, Music). */
const CUSTOMER_MENU_ITEMS: SidebarMenuItem[] = [
  { id: 'horoscope', icon: '♈', label: 'Horoscope', href: '/horoscope', submenu: [
    { label: 'Horoscope Scope', href: '/horoscope/horoscope-scope' }, { label: 'Zodiac Sign', href: '/astrology/zodiac-sign' },
    { label: 'Daily Horoscope', href: '/horoscope/daily' }, { label: 'Weekly Horoscope', href: '/horoscope/weekly' },
    { label: 'Monthly Horoscope', href: '/horoscope/monthly' }, { label: 'Yearly Horoscope', href: '/horoscope/yearly' },
  ]},
  { id: 'astrology', icon: '⭐', label: 'Astrology', href: '/astrology', submenu: [
    { label: 'Zodiac Sign', href: '/astrology/zodiac-sign' }, { label: 'Birth Chart', href: '/astrology/birth-chart' }, { label: 'Planetary Positions', href: '/astrology/planets' },
    { label: 'Transits', href: '/astrology/transits' }, { label: 'Compatibility', href: '/astrology/compatibility' },
  ]},
  { id: 'puja', icon: '🕉️', label: 'Puja', href: '/puja', submenu: [
    { label: 'Daily Puja', href: '/puja/daily' }, { label: 'Festival Puja', href: '/puja/festival' },
    { label: 'Special Puja', href: '/puja/special' }, { label: 'Puja Calendar', href: '/puja/calendar' },
  ]},
  { id: 'music', icon: '🎵', label: 'Music', href: '/music', submenu: [
    { label: 'Music Type', href: '/music/music-type' }, { label: 'Music', href: '/music/music' },
    { label: 'Listen', href: '/music/listen' },
  ]},
];

/** Fallback for Superadmin when menu tree API fails or returns empty (full admin CRUD menus). */
const ADMIN_MENU_ITEMS: SidebarMenuItem[] = [
  ...CUSTOMER_MENU_ITEMS,
  { id: 'master-setting', icon: '⚙️', label: 'Master Setting', href: '/master-setting', submenu: [
    { label: 'General', href: '/master-setting/general', submenu: [
      { label: 'Country', href: '/master-setting/general/country' }, { label: 'State', href: '/master-setting/general/state' },
      { label: 'District', href: '/master-setting/general/district' }, { label: 'Local Unit Type', href: '/master-setting/general/local-unit-type' },
      { label: 'Local Unit', href: '/master-setting/general/local-unit' },
    ]},
  ]},
  { id: 'settings', icon: '🔧', label: 'Settings', href: '/settings', submenu: [
    { label: 'Configuration', href: '/settings/system-settings' },
  ]},
  { id: 'user-management', icon: '👥', label: 'User Management', href: '/user-management', submenu: [
    { label: 'User', href: '/user-management/user' }, { label: 'Role', href: '/user-management/role' },
    { label: 'Permission', href: '/user-management/permission' }, { label: 'Permission Group', href: '/user-management/permission-group' },
    { label: 'Menu', href: '/user-management/menu' }, { label: 'Customers', href: '/user-management/customers' },
  ]},
  { id: 'event-management', icon: '📅', label: 'Event Management', href: '/event-management', submenu: [
    { label: 'Event Category', href: '/event-management/event-category' },
    { label: 'Event', href: '/event-management/event' },
    { label: 'Calendar', href: '/event-management/calendar' },
  ]},
  { id: 'message-management', icon: '💬', label: 'Message Management', href: '/support', submenu: [
    { label: 'Support Message', href: '/support/support-message' }, { label: 'Ticket', href: '/support/ticket' },
    { label: 'FAQ', href: '/support/faq' }, { label: 'FAQ Category', href: '/support/faq-category' },
    { label: 'Message Template', href: '/support/messaging-template' }, { label: 'Bulk Message', href: '/support/bulk-message' },
  ]},
];

/** Known route → display label (fixes API returning wrong/corrupt names e.g. "ateasier Management"). */
const KNOWN_MENU_LABELS: Record<string, string> = {
  '/user-management': 'User Management',
  '/user-management/user': 'User',
  '/user-management/role': 'Role',
  '/user-management/permission': 'Permission',
  '/user-management/permission-group': 'Permission Group',
  '/user-management/menu': 'Menu',
  '/user-management/customers': 'Customers',
  '/master-setting': 'Master Setting',
  '/master-setting/general': 'General',
  '/settings': 'Settings',
  '/settings/system-settings': 'Configuration',
  '/event-management': 'Event Management',
  '/event-management/event-category': 'Event Category',
  '/event-management/event': 'Event',
  '/event-management/calendar': 'Calendar',
  '/event-management/puja': 'Puja',
  '/support': 'Message Management',
  '/support/support-message': 'Support Message',
  '/support/ticket': 'Ticket',
  '/support/faq': 'FAQ',
  '/support/faq-category': 'FAQ Category',
  '/support/messaging-template': 'Message Template',
  '/support/bulk-message': 'Bulk Message',
  '/horoscope': 'Horoscope',
  '/horoscope/horoscope-scope': 'Horoscope Scope',
  '/horoscope/daily': 'Daily Horoscope',
  '/horoscope/weekly': 'Weekly Horoscope',
  '/horoscope/monthly': 'Monthly Horoscope',
  '/horoscope/yearly': 'Yearly Horoscope',
  '/astrology': 'Astrology',
  '/astrology/zodiac-sign': 'Zodiac Sign',
  '/puja': 'Puja',
  '/music': 'Music',
  '/music/music-type': 'Music Type',
  '/music/music': 'Music',
  '/music/listen': 'Listen',
  '/master-setting/general/country': 'Country',
  '/master-setting/general/state': 'State',
  '/master-setting/general/district': 'District',
  '/master-setting/general/local-unit-type': 'Local Unit Type',
  '/master-setting/general/local-unit': 'Local Unit',
};

function normalizeHref(href: string): string {
  const s = (href || '').replace(/\?.*$/, '').trim();
  const withSlash = s.startsWith('/') ? s : `/${s}`;
  return withSlash.replace(/\/+$/, '') || '/';
}

function getDisplayLabel(href: string, apiName: string): string {
  const key = normalizeHref(href);
  return KNOWN_MENU_LABELS[key] ?? apiName ?? '';
}

function mapMenuResponseToItem(m: MenuResponse): SidebarMenuItem {
  const href = m.url || '#';
  const submenu = m.subMenu?.length
    ? m.subMenu.map((sub) => {
        const subHref = sub.url || '#';
        return {
          label: getDisplayLabel(subHref, sub.name),
          href: subHref,
          submenu: sub.subMenu?.length
            ? sub.subMenu.map((n) => ({ label: getDisplayLabel(n.url || '#', n.name), href: n.url || '#' }))
            : undefined,
        };
      })
    : undefined;
  return {
    id: String(m.id),
    icon: m.icon || '•',
    label: getDisplayLabel(href, m.name),
    href,
    submenu,
  };
}

export default function Sidebar({ collapsed, onCollapseToggle }: SidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const submenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [collapsedOpenId, setCollapsedOpenId] = useState<string | null>(null);
  const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = (close: () => void) => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      close();
      closeTimerRef.current = null;
    }, HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => () => clearCloseTimer(), []);

  const VIEWPORT_PADDING = 12;

  const adjustSubmenuUpIfNeeded = (el: HTMLElement | null, padding = VIEWPORT_PADDING) => {
    if (!el) return;
    const run = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight - padding) {
        const newTop = window.innerHeight - el.offsetHeight - padding;
        el.style.top = `${Math.max(padding, newTop)}px`;
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(run));
  };

  useEffect(() => {
    if (!openSubmenuId || collapsed) return;
    const submenu = submenuRefs.current[openSubmenuId];
    if (!submenu) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const r = submenu.getBoundingClientRect();
        if (r.bottom > window.innerHeight - VIEWPORT_PADDING) {
          const newTop = window.innerHeight - submenu.offsetHeight - VIEWPORT_PADDING;
          submenu.style.top = `${Math.max(VIEWPORT_PADDING, newTop)}px`;
        }
      });
    });
  }, [openSubmenuId, collapsed]);

  useEffect(() => {
    if (!collapsedOpenId || !collapsed) return;
    const submenu = submenuRefs.current[`collapsed-${collapsedOpenId}`];
    if (!submenu) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const r = submenu.getBoundingClientRect();
        if (r.bottom > window.innerHeight - VIEWPORT_PADDING) {
          const newTop = window.innerHeight - submenu.offsetHeight - VIEWPORT_PADDING;
          submenu.style.top = `${Math.max(VIEWPORT_PADDING, newTop)}px`;
        }
      });
    });
  }, [collapsedOpenId, collapsed]);

  const [menuItems, setMenuItems] = useState<SidebarMenuItem[]>(ADMIN_MENU_ITEMS);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getProfile();
        const roleName = (profile?.roleName ?? '').trim();
        const isCustomer = /customer/i.test(roleName) || profile?.userDetail?.userType === 'CUSTOMER';
        if (isCustomer) {
          if (!cancelled) setMenuItems(CUSTOMER_MENU_ITEMS);
          setMenuLoading(false);
          return;
        }
        // Superadmin: use static admin menu so labels and structure are always correct.
        // Menu CRUD (User Management → Menu) still configures backend; sidebar uses this list.
        if (!cancelled) setMenuItems(ADMIN_MENU_ITEMS);
      } catch {
        if (!cancelled) setMenuItems(ADMIN_MENU_ITEMS);
      } finally {
        if (!cancelled) setMenuLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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
      }).filter(item => item !== null) as SidebarMenuItem[];
  }, [searchQuery, menuItems]);

  if (collapsed) {
    return (
      <aside 
        className="bg-white dark:bg-slate-800 text-black dark:text-slate-200 w-20 flex flex-col fixed left-0 top-[64px] bottom-0 z-50 shadow-lg border-r border-slate-200 dark:border-slate-700 hidden md:flex overflow-visible"
        onClick={(e) => {
          // Prevent clicks inside sidebar from closing it
          e.stopPropagation();
        }}
      >
        
        
        <nav className="flex-1 overflow-x-visible py-4">
          <div className="px-3 relative">
            {menuItems.map((item) => {
              const itemActive = isActive(item.href);
              const hasSubmenu = item.submenu && item.submenu.length > 0;
              return (
                <div
                  key={item.id}
                  className="relative group"
                  onMouseEnter={(e) => {
                    if (hasSubmenu) {
                      clearCloseTimer();
                      setCollapsedOpenId(item.id);
                      const submenu = submenuRefs.current[`collapsed-${item.id}`];
                      if (submenu) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        submenu.style.position = 'fixed';
                        submenu.style.left = `${rect.right}px`;
                        submenu.style.top = `${rect.top}px`;
                        adjustSubmenuUpIfNeeded(submenu);
                      }
                    }
                  }}
                  onMouseLeave={() => hasSubmenu && scheduleClose(() => setCollapsedOpenId(null))}
                >
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={`w-full flex items-center justify-center p-3 rounded-lg mb-1 transition-all ${
                      itemActive
                        ? 'bg-blue-500 dark:bg-blue-600 text-white'
                        : 'text-black dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                  </Link>
                  {/* Expand submenu with all links – same alignment as menu, delay before close */}
                  {hasSubmenu && item.submenu && (
                    <div
                      ref={(el) => { submenuRefs.current[`collapsed-${item.id}`] = el; }}
                      className={`absolute left-full ml-0 top-0 min-w-[220px] py-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-600 transition-opacity duration-200 z-[9999] ${
                        collapsedOpenId === item.id ? 'opacity-100 visible pointer-events-auto' : 'opacity-0 invisible pointer-events-none'
                      }`}
                      onMouseEnter={() => { clearCloseTimer(); setCollapsedOpenId(item.id); }}
                      onMouseLeave={() => scheduleClose(() => setCollapsedOpenId(null))}
                    >
                      <Link
                        href={item.href}
                        prefetch={true}
                        className={`block px-4 py-2.5 text-sm font-bold border-b border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          itemActive ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/50' : 'text-black dark:text-slate-200'
                        }`}
                      >
                        {getDisplayLabel(item.href, item.label)}
                      </Link>
                      <div className="pt-1 pb-0">
                        {(item.submenu ?? []).map((subItem, idx) => {
                          const hasNested = 'submenu' in subItem && subItem.submenu && subItem.submenu.length > 0;
                          const subHref = 'href' in subItem ? subItem.href : '#';
                          const subActive = isActive(subHref);
                          return (
                            <div key={idx}>
                              <Link
                                href={subHref}
                                prefetch={true}
                                className={`block px-4 py-2 text-sm font-bold rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 border-l-2 border-transparent hover:border-blue-500 ${
                                  subActive ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/50 border-blue-500' : 'text-black dark:text-slate-300'
                                }`}
                              >
                                {getDisplayLabel(subItem.href, subItem.label)}
                              </Link>
                              {hasNested && 'submenu' in subItem && subItem.submenu?.map((nested: { label: string; href: string }, nestedIdx: number) => (
                                <Link
                                  key={nestedIdx}
                                  href={nested.href}
                                  prefetch={true}
                                  className={`block px-4 pl-6 py-1.5 text-sm font-bold rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 border-l-2 border-transparent hover:border-blue-500 ${
                                    isActive(nested.href) ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/50 border-blue-500' : 'text-black dark:text-slate-400'
                                  }`}
                                >
                                  {nested.label}
                                </Link>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
      className="bg-white dark:bg-slate-800 text-black dark:text-slate-200 w-[280px] flex flex-col fixed left-0 top-[64px] bottom-0 z-[100] shadow-lg border-r border-slate-200 dark:border-slate-700"
      onClick={(e) => {
        // Prevent clicks inside sidebar from closing it
        e.stopPropagation();
      }}
    >
    
      
      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-visible">
        {/* Search Bar */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-black dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 text-black dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-500 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
            />
          </div>
        </div>

        <div className="relative">
          
          {filteredMenuItems.length === 0 && searchQuery.trim() !== '' ? (
            <div className="text-center py-8 text-black dark:text-slate-400 text-sm">
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
                        clearCloseTimer();
                        setOpenSubmenuId(item.id);
                        const submenu = submenuRefs.current[item.id];
                        if (submenu) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          submenu.style.left = `${rect.right}px`;
                          submenu.style.top = `${rect.top}px`;
                          adjustSubmenuUpIfNeeded(submenu);
                        }
                      }}
                      onMouseLeave={() => scheduleClose(() => setOpenSubmenuId(null))}
                    >
                      <span className="mr-3 w-5 text-center">{item.icon}</span>
                      <span className="flex-1 text-sm">{getDisplayLabel(item.href, item.label)}</span>
                      <span className="text-[10px] text-black dark:text-slate-500">▶</span>
                      
                      {/* Submenu – same alignment (padding) as menu, delay before close */}
                      <div 
                        ref={(el) => { submenuRefs.current[item.id] = el; }}
                        className={`sidebar-submenu ${openSubmenuId === item.id ? 'is-open' : ''}`}
                        onMouseEnter={() => { clearCloseTimer(); setOpenSubmenuId(item.id); }}
                        onMouseLeave={() => scheduleClose(() => setOpenSubmenuId(null))}
                      >
                        {(item.submenu ?? []).map((subItem, idx) => {
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
                                      adjustSubmenuUpIfNeeded(nestedSubmenu);
                                    }
                                  }}
                                >
                                  {getDisplayLabel(subItem.href, subItem.label)}
                                  <span className="text-black dark:text-slate-500 absolute right-3">›</span>
                                  
                                  {/* Nested Submenu */}
                                  <div className="nested-submenu">
                                    {'submenu' in subItem && subItem.submenu && subItem.submenu.map((nestedItem: { label: string; href: string }, nestedIdx: number) => (
                                      <Link
                                        key={nestedIdx}
                                        href={nestedItem.href}
                                        prefetch={true}
                                        className={`nested-submenu-item ${isActive(nestedItem.href) ? 'active' : ''}`}
                                      >
                                        {getDisplayLabel(nestedItem.href, nestedItem.label)}
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
                                  {getDisplayLabel(subItem.href, subItem.label)}
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
                      <span className="flex-1 text-sm">{getDisplayLabel(item.href, item.label)}</span>
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
            color: #000000;
            font-size: 14px;
            font-weight: bold;
          }

          .sidebar-menu-item:hover {
            background: #f1f5f9;
          }

          .sidebar-menu-item.active {
            background: #3b82f6;
            color: white;
          }

          .sidebar-submenu {
            position: fixed;
            background: #ffffff;
            min-width: 220px;
            border-radius: 8px;
            box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.1);
            display: none;
            z-index: 99999 !important;
            border: 1px solid #e2e8f0;
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
            border-color: transparent #ffffff transparent transparent;
          }

          .sidebar-submenu.is-open {
            display: block !important;
          }

          .sidebar-submenu-item {
            padding: 12px 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            color: #000000;
            font-size: 14px;
            font-weight: bold;
            border-left: 3px solid transparent;
            display: block;
            text-decoration: none;
          }

          .sidebar-submenu-item:hover {
            background: #f1f5f9;
            color: #000000;
            border-left: 3px solid #3b82f6;
          }

          .sidebar-submenu-item.active {
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            color: #1d4ed8;
          }

          .sidebar-submenu-item-wrapper {
            position: relative;
          }

          .sidebar-submenu-item.has-children {
            padding-right: 30px;
          }

          .nested-submenu {
            position: fixed;
            background: #ffffff;
            min-width: 220px;
            border-radius: 8px;
            box-shadow: 5px 5px 20px rgba(0,0,0,0.1);
            display: none;
            z-index: 999999 !important;
            border: 1px solid #e2e8f0;
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
            border-color: transparent #ffffff transparent transparent;
          }

          .sidebar-submenu-item.has-children:hover .nested-submenu,
          .nested-submenu:hover {
            display: block !important;
          }

          .nested-submenu-item {
            padding: 12px 15px;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
            color: #000000;
            font-size: 14px;
            font-weight: bold;
            border-left: 3px solid transparent;
            display: block;
            text-decoration: none;
          }

          .nested-submenu-item:hover {
            background: #f1f5f9;
            color: #000000;
            border-left: 3px solid #3b82f6;
          }

          .nested-submenu-item.active {
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            color: #1d4ed8;
          }

          /* Dark mode – sidebar menu & submenus */
          .dark .sidebar-menu-item {
            color: #e2e8f0;
          }
          .dark .sidebar-menu-item:hover {
            background: #334155;
          }
          .dark .sidebar-menu-item.active {
            background: #2563eb;
            color: white;
          }
          .dark .sidebar-submenu {
            background: #334155;
            border-color: #475569;
            box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.3);
          }
          .dark .sidebar-submenu::before {
            border-color: transparent #334155 transparent transparent;
          }
          .dark .sidebar-submenu-item {
            color: #e2e8f0;
          }
          .dark .sidebar-submenu-item:hover {
            background: #475569;
            color: white;
            border-left-color: #3b82f6;
          }
          .dark .sidebar-submenu-item.active {
            background: #475569;
            border-left-color: #3b82f6;
            color: #93c5fd;
          }
          .dark .nested-submenu {
            background: #475569;
            border-color: #64748b;
            box-shadow: 5px 5px 20px rgba(0, 0, 0, 0.3);
          }
          .dark .nested-submenu::before {
            border-color: transparent #475569 transparent transparent;
          }
          .dark .nested-submenu-item {
            color: #e2e8f0;
          }
          .dark .nested-submenu-item:hover {
            background: #64748b;
            color: white;
            border-left-color: #3b82f6;
          }
          .dark .nested-submenu-item.active {
            background: #64748b;
            border-left-color: #3b82f6;
            color: #93c5fd;
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
