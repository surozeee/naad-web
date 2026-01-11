'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [headerMenuCollapsed, setHeaderMenuCollapsed] = useState(false);

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      setSidebarCollapsed(JSON.parse(savedState));
    } else {
      // Set initial sidebar state based on screen size if no saved state
      if (window.innerWidth >= 768) {
        setSidebarCollapsed(false);
      } else {
        setSidebarCollapsed(true);
      }
    }
  }, []);

  // Save sidebar state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

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
        <Sidebar collapsed={sidebarCollapsed} />
        
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
          
          <Footer />
        </div>
      </div>
    </div>
  );
}
