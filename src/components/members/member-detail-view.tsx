'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Member, Payment, MonthlyInstallment, PaymentMethod, PaymentStatus, Auction } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { StatCard } from '@/components/ui/stat-card';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createPaymentAction, updatePaymentAction } from '@/actions/payment-actions';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Trophy,
  CreditCard,
  Edit2,
} from 'lucide-react';

interface MemberDetailViewProps {
  member: Member;
  summary: {
    total_expected: number;
    total_paid: number;
    total_pending: number;
    payment_count: number;
    last_payment_date: string | null;
    won_auction: Auction | null;
  };
  ledger: {
    installment_id: string;
    month_number: number;
    month_name: string;
    due_date: string;
    expected_amount: number;
    paid_amount: number;
    balance: number;
    status: string;
    last_payment_date: string | null;
    last_payment_method: string | null;
    reference_number: string | null;
    payments: Payment[];
  }[];
  payments: Payment[];
  installments: MonthlyInstallment[];
  isAdmin?: boolean;
}

export function MemberDetailView({
  member,
  summary,
  ledger,
  payments,
  installments,
  isAdmin = false,
}: MemberDetailViewProps) {
  const toast = useToast();
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState(installments[0]?.id || '');
  const [amount, setAmount] = useState('5000');
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit payment states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('5000');
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0, 10));
  const [editMethod, setEditMethod] = useState<PaymentMethod>('UPI');
  const [editRefNo, setEditRefNo] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('Completed');
  const [editNotes, setEditNotes] = useState('');

  const openEditModal = (payment: Payment) => {
    if (!isAdmin) return;
    setSelectedPayment(payment);
    setEditAmount(payment.amount.toString());
    setEditDate(payment.payment_date);
    setEditMethod(payment.payment_method);
    setEditRefNo(payment.reference_number || '');
    setEditStatus(payment.status);
    setEditNotes(payment.notes || '');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedPayment) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_id', member.id);
    formData.append('installment_id', selectedPayment.installment_id);
    formData.append('amount', editAmount);
    formData.append('payment_date', editDate);
    formData.append('payment_method', editMethod);
    formData.append('reference_number', editRefNo);
    formData.append('status', editStatus);
    formData.append('notes', editNotes);

    const res = await updatePaymentAction(selectedPayment.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Payment details updated successfully!');
      setIsEditModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to update payment');
    }
  };

  const openPayForMonth = (instId: string, defaultDue: number) => {
    setSelectedInstId(instId);
    setAmount(defaultDue > 0 ? defaultDue.toString() : '5000');
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_id', member.id);
    formData.append('installment_id', selectedInstId);
    formData.append('amount', amount);
    formData.append('payment_date', new Date().toISOString().slice(0, 10));
    formData.append('payment_method', method);
    formData.append('reference_number', refNo);
    formData.append('notes', notes);

    const res = await createPaymentAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Payment of ${formatINR(parseFloat(amount))} recorded!`);
      setIsPayModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/members"
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 px-2 py-0.5 rounded-md">
                SLOT #{member.member_number}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {member.name}
              </h1>
              {summary.won_auction && (
                <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  <Trophy className="w-3.5 h-3.5" /> Lifted Chit
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Joined: {member.joined_date || '2026-09-01'}</p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => openPayForMonth(installments[0]?.id, 5000)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm active:scale-95 transition-all self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Member Info Card & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Phone</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{member.phone || '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
            <Mail className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Email</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {member.email || '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Address</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {member.address || '—'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-xl">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Status</span>
            <span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400">
              {member.status}
            </span>
          </div>
        </div>
      </div>

      {/* Financial Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expected"
          value={formatINR(summary.total_expected)}
          subtitle={`Across all ${ledger.length} installments`}
          accentColor="blue"
          icon={<Wallet className="w-6 h-6" />}
        />
        <StatCard
          title="Total Paid"
          value={formatINR(summary.total_paid)}
          subtitle={`${summary.payment_count} transactions recorded`}
          accentColor="emerald"
          icon={<CheckCircle2 className="w-6 h-6" />}
        />
        <StatCard
          title="Total Outstanding"
          value={formatINR(summary.total_pending)}
          subtitle={summary.total_pending === 0 ? 'Fully Paid Up' : 'Pending clearance'}
          accentColor={summary.total_pending > 0 ? 'rose' : 'emerald'}
          icon={<AlertCircle className="w-6 h-6" />}
        />
        <StatCard
          title="Last Payment"
          value={summary.last_payment_date || 'None'}
          subtitle={summary.last_payment_date ? 'Latest contribution' : 'No payments yet'}
          accentColor="slate"
          icon={<CreditCard className="w-6 h-6" />}
        />
      </div>

      {/* Month-wise Installment Ledger for this Member */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Monthly Installment Ledger ({ledger.length} Months)
          </h2>
          <p className="text-xs text-slate-400">
            Due amounts, payments made, and remaining balances for each monthly cycle
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 pl-3 pr-2 whitespace-nowrap">Month</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Due Amount</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Paid Amount</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Balance</th>
                <th className="py-3 px-3 whitespace-nowrap">Payment Date</th>
                <th className="py-3 px-3 whitespace-nowrap">Method</th>
                <th className="py-3 px-3 whitespace-nowrap">Reference</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                {isAdmin && <th className="py-3 pr-3 pl-2 text-right whitespace-nowrap">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {ledger.map((item) => (
                <tr key={item.installment_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 pl-3 pr-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    Month {item.month_number} ({item.month_name})
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {formatINR(item.expected_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatINR(item.paid_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {formatINR(item.balance)}
                  </td>
                  <td className="py-3.5 px-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {item.last_payment_date || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {item.last_payment_method || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-xs font-mono text-slate-400 truncate max-w-[120px]">
                    {item.reference_number || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <StatusBadge status={item.status} />
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 pr-3 pl-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.balance > 0 ? (
                          <button
                            onClick={() => openPayForMonth(item.installment_id, item.balance)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 active:scale-95 shadow-xs"
                          >
                            Collect
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                          </span>
                        )}
                        {item.payments && item.payments.length > 0 && (
                          <button
                            onClick={() => openEditModal(item.payments[0])}
                            title="Edit Payment (Txn Ref, Date, Method, Remarks)"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Complete Payment Transactions History */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Payment Transactions Log ({payments.length})
          </h2>
          <p className="text-xs text-slate-400">
            Chronological log of all transactions recorded for this member
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            No payments recorded yet for this member.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Date</th>
                  <th className="pb-3">Month</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3">Reference / Txn ID</th>
                  <th className="pb-3">Notes</th>
                  <th className="pb-3 text-center">Status</th>
                  {isAdmin && <th className="pb-3 text-right pr-2">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 pl-2 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {p.payment_date}
                    </td>
                    <td className="py-3.5 font-medium text-slate-900 dark:text-white">
                      {p.month_name || 'Installment'}
                    </td>
                    <td className="py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 text-xs text-slate-600 dark:text-slate-300">
                      {p.payment_method}
                    </td>
                    <td className="py-3.5 text-xs font-mono text-slate-500">
                      {p.reference_number || '—'}
                    </td>
                    <td className="py-3.5 text-xs text-slate-400 truncate max-w-[200px]">
                      {p.notes || '—'}
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 text-right pr-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Payment Record"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inline Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment for ${member.name}`}
        description="Add a transaction entry to this member's chit record"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Select Month
            </label>
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {installments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  Month {inst.month_number} ({inst.month_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/12345678"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Notes
            </label>
            <textarea
              rows={2}
              placeholder="Notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPayModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Payment for ${member.name}`}
        description="Update transaction reference ID, date, method, or remarks"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                required
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Method
              </label>
              <select
                value={editMethod}
                onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as PaymentStatus)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Reference / Txn ID
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/12345678"
              value={editRefNo}
              onChange={(e) => setEditRefNo(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              placeholder="Notes..."
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
