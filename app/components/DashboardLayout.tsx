'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import SimpleFooter from './SimpleFooter';
import { SessionAuthGuard } from './providers/SessionAuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionAuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </SessionAuthGuard>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      try {
        return JSON.parse(savedState) as boolean;
      } catch {
        return window.innerWidth < 768;
      }
    }
    return window.innerWidth < 768;
  });

  const [headerMenuCollapsed, setHeaderMenuCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [mounted]);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted]);

  return (
    <div className="dashboard-layout min-h-screen flex flex-col">
      <Header
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        menuCollapsed={headerMenuCollapsed}
        onMenuToggle={() => setHeaderMenuCollapsed(!headerMenuCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex flex-1 relative">
        <Sidebar
          collapsed={sidebarCollapsed}
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {!sidebarCollapsed && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSidebarCollapsed(true);
              }
            }}
          />
        )}

        <div
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? 'md:ml-[90px]' : 'md:ml-[290px]'
          }`}
        >
          <main className="flex-1 overflow-y-auto">
            <div className="p-1">{children}</div>
          </main>
          <SimpleFooter />
        </div>
      </div>
    </div>
  );
}
