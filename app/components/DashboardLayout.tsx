'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [headerMenuCollapsed, setHeaderMenuCollapsed] = useState(false);

  // Set initial sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // On desktop, start with sidebar expanded
        setSidebarCollapsed(false);
      } else {
        // On mobile, start with sidebar collapsed
        setSidebarCollapsed(true);
      }
    };

    // Set initial state
    handleResize();

    // Optional: Update on resize (uncomment if you want responsive behavior)
    // window.addEventListener('resize', handleResize);
    // return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} />
      
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}
      
      <div 
        className={`flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-[90px]' : 'md:ml-[290px]'
        }`}
      >
        <Header 
          onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          menuCollapsed={headerMenuCollapsed}
          onMenuToggle={() => setHeaderMenuCollapsed(!headerMenuCollapsed)}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="p-6">
            {children}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
