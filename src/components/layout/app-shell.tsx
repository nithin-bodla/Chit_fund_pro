'use client';

import React, { createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { ToastProvider } from '../ui/toast';

interface AdminContextType {
  isAdmin: boolean;
  username?: string;
}

const AdminContext = createContext<AdminContextType>({
  isAdmin: false,
});

export const useAdmin = () => useContext(AdminContext);

interface AppShellProps {
  children: React.ReactNode;
  username?: string;
  isAdmin?: boolean;
}

export function AppShell({ children, username, isAdmin = false }: AppShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <ToastProvider>
        <AdminContext.Provider value={{ isAdmin, username }}>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center">
            {children}
          </div>
        </AdminContext.Provider>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AdminContext.Provider value={{ isAdmin, username }}>
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased font-sans selection:bg-emerald-500 selection:text-white">
          <div className="flex-1 flex min-h-0">
            {/* Desktop Sidebar */}
            <Sidebar username={username} isAdmin={isAdmin} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
              {/* Mobile Top Header & Drawer */}
              <MobileNav username={username} isAdmin={isAdmin} />

              {/* Page Content Container */}
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </AdminContext.Provider>
    </ToastProvider>
  );
}
