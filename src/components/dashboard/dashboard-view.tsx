'use client';

import React, { useState } from 'react';
import { DashboardMetrics, PaymentMethod, MonthlyInstallment, Member } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { StatCard } from '@/components/ui/stat-card';
import { ProgressBar } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createPaymentAction } from '@/actions/payment-actions';
import {
  Wallet,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  ArrowUpRight,
  Gavel,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  installments: MonthlyInstallment[];
  members: Member[];
  isAdmin?: boolean;
}

export function DashboardView({
  metrics,
  installments,
  members,
  isAdmin = false,
}: DashboardViewProps) {
  const toast = useToast();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>(installments[0]?.id || '');
  const [paymentAmount, setPaymentAmount] = useState<string>('5000');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When member changes, autofill default monthly amount
  const handleMemberChange = (mId: string) => {
    setSelectedMemberId(mId);
    const memberStatus = metrics.member_statuses.find((s) => s.member_id === mId);
    if (memberStatus) {
      const remainingBalance = memberStatus.balance > 0 ? memberStatus.balance : memberStatus.expected_amount;
      setPaymentAmount(remainingBalance.toString());
    }
  };

  const handleOpenPaymentModal = (mId?: string) => {
    if (mId) {
      handleMemberChange(mId);
    } else {
      setSelectedMemberId(members[0]?.id || '');
      setPaymentAmount('5000');
    }
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_id', selectedMemberId);
    formData.append('installment_id', selectedInstallmentId);
    formData.append('amount', paymentAmount);
    formData.append('payment_date', new Date().toISOString().slice(0, 10));
    formData.append('payment_method', paymentMethod);
    formData.append('reference_number', referenceNumber);
    formData.append('notes', notes);

    const res = await createPaymentAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Payment of ${formatINR(parseFloat(paymentAmount))} recorded successfully!`);
      setIsPaymentModalOpen(false);
      setReferenceNumber('');
      setNotes('');
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active Cycle • Month {metrics.current_month_number} of {installments.length}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {metrics.chit_name}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Managing {metrics.total_members} members with monthly installments. All financial summaries are calculated directly from verified database entries.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="relative z-10 flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => handleOpenPaymentModal()}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
          <Link
            href="/auction"
            className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl backdrop-blur-md transition-all text-sm"
          >
            <Gavel className="w-4 h-4" />
            <span>Auction / Lift</span>
          </Link>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Chit Value"
          value={formatINR(metrics.total_chit_value)}
          subtitle={`Across ${installments.length} months`}
          accentColor="purple"
          icon={<Wallet className="w-6 h-6" />}
        />
        <StatCard
          title="Total Collected So Far"
          value={formatINR(metrics.total_collected_overall)}
          subtitle={`${metrics.total_members} Members enrolled`}
          accentColor="emerald"
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
        <StatCard
          title="This Month Expected"
          value={formatINR(metrics.expected_this_month)}
          subtitle={`Month: ${metrics.current_month_name}`}
          accentColor="blue"
          icon={<Calendar className="w-6 h-6" />}
        />
        <StatCard
          title="This Month Pending"
          value={formatINR(metrics.pending_this_month)}
          subtitle={`Collected: ${formatINR(metrics.collected_this_month)}`}
          accentColor={metrics.pending_this_month > 0 ? 'rose' : 'emerald'}
          icon={<AlertCircle className="w-6 h-6" />}
        />
      </div>

      {/* Current Month Collection Progress Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Monthly Collection Progress ({metrics.current_month_name})</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {metrics.collection_percentage_this_month}% Completed
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status of {metrics.member_statuses.length} member contributions for this installment
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">Expected</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                {formatINR(metrics.expected_this_month)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Collected</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {formatINR(metrics.collected_this_month)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Pending</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                {formatINR(metrics.pending_this_month)}
              </span>
            </div>
          </div>
        </div>

        <ProgressBar value={metrics.collection_percentage_this_month} className="my-3" />

        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Overall Chit Pending: <strong className="text-rose-600 dark:text-rose-400 font-mono">{formatINR(metrics.total_outstanding_overall)}</strong></span>
          <Link href="/collection" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1">
            <span>View All Monthly Schedules</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Member Payment Status Breakdown for Current Month */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Member Payment Status ({metrics.current_month_name})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Individual breakdown of all enrolled members for the current installment
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/members"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Manage Members ({members.length})
            </Link>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <th className="pb-3 pl-2">#</th>
                <th className="pb-3">Member Name</th>
                <th className="pb-3 text-right">Expected</th>
                <th className="pb-3 text-right">Paid</th>
                <th className="pb-3 text-right">Balance</th>
                <th className="pb-3 text-center">Status</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {metrics.member_statuses.map((status) => (
                <tr key={status.member_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 pl-2 font-mono font-medium text-slate-400 text-xs">
                    {status.member_number}
                  </td>
                  <td className="py-4">
                    <Link
                      href={`/members/${status.member_id}`}
                      className="font-semibold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block"
                    >
                      {status.member_name}
                    </Link>
                    <span className="text-xs text-slate-400">{status.phone || 'No phone'}</span>
                  </td>
                  <td className="py-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                    {formatINR(status.expected_amount)}
                  </td>
                  <td className="py-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatINR(status.paid_amount)}
                  </td>
                  <td className="py-4 text-right font-mono font-medium text-slate-900 dark:text-white">
                    {formatINR(status.balance)}
                  </td>
                  <td className="py-4 text-center">
                    <StatusBadge status={status.status} />
                  </td>
                  <td className="py-4 text-right pr-2">
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && status.balance > 0 && (
                        <button
                          onClick={() => handleOpenPaymentModal(status.member_id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95"
                        >
                          Collect
                        </button>
                      )}
                      <Link
                        href={`/members/${status.member_id}`}
                        className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-3">
          {metrics.member_statuses.map((status) => (
            <div
              key={status.member_id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Member #{status.member_number}
                  </span>
                  <Link
                    href={`/members/${status.member_id}`}
                    className="font-bold text-slate-900 dark:text-white block hover:text-emerald-600"
                  >
                    {status.member_name}
                  </Link>
                </div>
                <StatusBadge status={status.status} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs py-2 border-y border-slate-200/60 dark:border-slate-700/60 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Expected</span>
                  <span className="font-semibold">{formatINR(status.expected_amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Paid</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatINR(status.paid_amount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-sans">Balance</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {formatINR(status.balance)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Link
                  href={`/members/${status.member_id}`}
                  className="text-xs text-slate-500 hover:underline"
                >
                  View History
                </Link>
                {isAdmin && status.balance > 0 && (
                  <button
                    onClick={() => handleOpenPaymentModal(status.member_id)}
                    className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Collect {formatINR(status.balance)}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Record Member Payment"
        description="Add a verified payment entry to the chit fund ledger"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => handleMemberChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.member_number} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Installment Month
            </label>
            <select
              value={selectedInstallmentId}
              onChange={(e) => setSelectedInstallmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {installments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  Month {inst.month_number} - {inst.month_name} ({formatINR(inst.expected_amount)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Reference / Txn ID
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/123456789 or Receipt #42"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Remarks or partial payment note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
