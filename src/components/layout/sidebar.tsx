'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CreditCard,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  Coins,
  ShieldCheck,
  Lock,
  Eye,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth-actions';

interface SidebarProps {
  username?: string;
  isAdmin?: boolean;
}

export function Sidebar({ username = 'Admin', isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/';
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Members', href: '/members', icon: Users },
    { name: 'Monthly Collection', href: '/collection', icon: CalendarCheck },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Auction / Lift', href: '/auction', icon: Gavel },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    ...(isAdmin
      ? [
          { name: 'Admin Hub', href: '/admin', icon: ShieldCheck },
          { name: 'Settings', href: '/settings', icon: Settings },
        ]
      : []),
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 h-screen sticky top-0 shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-900">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
          <Coins className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white leading-tight">ChitFund Pro</h1>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            {isAdmin ? 'Admin Edit Mode' : 'Public View Mode'}
          </p>
        </div>
      </div>

      {/* Navigation items */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Management
        </div>
        {navItems.map((item) => {
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span>{item.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-4 rounded-full bg-emerald-500" />
              )}
            </Link>
          );
        })}
      </div>

      {/* User profile / Admin login bottom pill */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-900">
        {isAdmin ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                {username ? username.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate capitalize">
                  {username || 'Admin'}
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold truncate">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out to View-Only Mode"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/admin"
            className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 hover:bg-emerald-100/60 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Admin Sign In
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Unlock edit access</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
