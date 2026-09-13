'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Menu,
  X,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  Coins,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth-actions';

const BOTTOM_NAV_ITEMS = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Collection', href: '/collection', icon: CalendarCheck },
  { name: 'Payments', href: '/payments', icon: CreditCard },
];

interface MobileNavProps {
  username?: string;
  isAdmin?: boolean;
}

export function MobileNav({ username = 'Admin', isAdmin = false }: MobileNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/';
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden h-14 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">ChitFund Pro</span>
            <span className="text-[10px] text-emerald-600 block leading-none font-medium">
              {isAdmin ? 'Admin Mode' : 'View Mode'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold"
            >
              <Lock className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          )}

          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-over Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative ml-auto w-4/5 max-w-xs h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col p-6 z-10 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-base text-slate-900 dark:text-white">
                {isAdmin ? 'Admin Menu' : 'Public Menu'}
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-1 flex-1 overflow-y-auto">
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname === '/'
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/members"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname.startsWith('/members')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Members</span>
              </Link>

              <Link
                href="/collection"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname.startsWith('/collection')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <CalendarCheck className="w-5 h-5" />
                <span>Monthly Collection</span>
              </Link>

              <Link
                href="/payments"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname.startsWith('/payments')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Payments Ledger</span>
              </Link>

              <Link
                href="/auction"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname.startsWith('/auction')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <Gavel className="w-5 h-5" />
                <span>Auction / Lift</span>
              </Link>

              <Link
                href="/reports"
                onClick={() => setDrawerOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                  pathname.startsWith('/reports')
                    ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                <span>Reports & CSV</span>
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      pathname === '/admin'
                        ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Admin Control Hub</span>
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                      pathname.startsWith('/settings')
                        ? 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Settings className="w-5 h-5" />
                    <span>Settings & DB</span>
                  </Link>
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              {isAdmin ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out ({username || 'Admin'})</span>
                </button>
              ) : (
                <Link
                  href="/admin"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>Admin Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-30 px-2 shadow-lg">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
