'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage or default based on screen size
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') {
      return true; // Default for SSR
    }
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      try {
        return JSON.parse(savedState);
      } catch {
        // If parsing fails, use default based on screen size
        return window.innerWidth < 768;
      }
    }
    // Default based on screen size if no saved state
    return window.innerWidth < 768;
  });
  
  const [headerMenuCollapsed, setHeaderMenuCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mark as mounted after first render
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle window resize - auto-collapse on mobile
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const handleResize = () => {
      // On mobile, always collapse sidebar
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    // Check on mount as well
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mounted]);

  // Save sidebar state to localStorage whenever it changes (only after mount)
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }
  }, [sidebarCollapsed, mounted]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Full width header at top */}
      <Header 
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        menuCollapsed={headerMenuCollapsed}
        onMenuToggle={() => setHeaderMenuCollapsed(!headerMenuCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      {/* Sidebar and body below header */}
      <div className="flex flex-1 relative">
        <Sidebar 
          collapsed={sidebarCollapsed} 
          onCollapseToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Mobile sidebar overlay */}
        {!sidebarCollapsed && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={(e) => {
              // Only close if clicking directly on the overlay, not on sidebar content
              if (e.target === e.currentTarget) {
                setSidebarCollapsed(true);
              }
            }}
          />
        )}
        
        {/* Main content area */}
        <div 
          className={`flex-1 flex flex-col transition-all duration-300 ${
            sidebarCollapsed ? 'md:ml-[90px]' : 'md:ml-[290px]'
          }`}
        >
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
