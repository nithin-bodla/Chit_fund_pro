'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CreditCard,
  Users,
  CalendarCheck,
  Gavel,
  Settings,
  BarChart3,
  LogOut,
  ArrowRight,
  Database,
  Coins,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { logoutAction } from '@/actions/auth-actions';
import { ChitGroup, DashboardMetrics, MonthlyInstallment, Member } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { StatCard } from '@/components/ui/stat-card';

interface AdminHubViewProps {
  username: string;
  group: ChitGroup;
  metrics: DashboardMetrics;
  installments: MonthlyInstallment[];
  members: Member[];
}

export function AdminHubView({
  username,
  group,
  metrics,
  installments,
  members,
}: AdminHubViewProps) {
  const handleLogout = async () => {
    await logoutAction();
    window.location.href = '/';
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                Administrator Signed In
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 text-xs font-medium">
                Full Edit Privileges
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Admin Control Center
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              You are currently authenticated as <strong className="text-white capitalize">{username}</strong>. All tables, member slots, payment records, and chit parameters are fully editable.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all border border-white/10"
            >
              View Public Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-900/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out to View-Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chit Fund Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chit Pool Amount"
          value={formatINR(group.monthly_base_amount)}
          subtitle={`Regular: ${formatINR(group.regular_member_monthly_amount || 5000)}/mo`}
          accentColor="emerald"
          icon={<Coins className="w-6 h-6" />}
        />
        <StatCard
          title="Enrolled Members"
          value={`${members.length} / ${group.total_members}`}
          subtitle={`${group.total_members - members.length} slots remaining`}
          accentColor="blue"
          icon={<Users className="w-6 h-6" />}
        />
        <StatCard
          title="Total Collected"
          value={formatINR(metrics.total_collected_overall)}
          subtitle={`Across ${installments.length} installment months`}
          accentColor="purple"
          icon={<CreditCard className="w-6 h-6" />}
        />
        <StatCard
          title="Outstanding Deficit"
          value={formatINR(metrics.total_outstanding_overall)}
          subtitle="Pending across all cycles"
          accentColor={metrics.total_outstanding_overall > 0 ? 'amber' : 'emerald'}
          icon={<AlertCircle className="w-6 h-6" />}
        />
      </div>

      {/* Quick Administrative Management Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Administrative Quick Actions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Rapidly jump into management sections to record transactions, enroll members, or adjust chit rules
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Record / Manage Payments */}
          <Link
            href="/payments"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                Record Member Payments
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Add verified member payments, edit receipts, and manage payment modes.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-emerald-600 mt-4">
              <span>Open Payment Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Enrolled Members */}
          <Link
            href="/members"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                Manage Members & Dues
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Enroll new member slots, edit member details, and view individual ledgers.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-blue-600 mt-4">
              <span>Open Members Register</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Monthly Collection */}
          <Link
            href="/collection"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors">
                Monthly Dues Collection
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inspect month-by-month collection cycles and collect individual member dues.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-teal-600 mt-4">
              <span>View Collection Cycles</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Auction & Chit Lift */}
          <Link
            href="/auction"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Gavel className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">
                Record Monthly Auction
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Record chit lift winners, view eligible members, and disburse payouts.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-amber-600 mt-4">
              <span>Open Auction Register</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 5: Chit & System Settings */}
          <Link
            href="/settings"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                Chit Fund & Group Settings
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure pool amounts, member limits, tenure calendar (+ Add Month), and password.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-purple-600 mt-4">
              <span>Open System Settings</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 6: Reports & Export */}
          <Link
            href="/reports"
            className="group p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                Financial Audit & CSV Export
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Export standard RFC-4180 audit spreadsheets and printable receipts.
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-rose-600 mt-4">
              <span>View Reports & Export</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
