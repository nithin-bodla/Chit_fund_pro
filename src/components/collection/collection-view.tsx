'use client';

import React, { useState } from 'react';
import { MonthCollectionSummary, MemberInstallmentStatus, PaymentMethod, PaymentStatus, Payment, Member } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { ProgressBar } from '@/components/ui/progress';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createPaymentAction, updatePaymentAction } from '@/actions/payment-actions';
import {
  CalendarCheck,
  ChevronRight,
  PlusCircle,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Gavel,
  Edit2,
} from 'lucide-react';
import Link from 'next/link';

interface CollectionViewProps {
  months: MonthCollectionSummary[];
  allMonthMembers: Record<string, MemberInstallmentStatus[]>;
  members: Member[];
  isAdmin?: boolean;
}

export function CollectionView({ months, allMonthMembers, members, isAdmin = false }: CollectionViewProps) {
  const toast = useToast();
  const [selectedMonthId, setSelectedMonthId] = useState<string>(months[0]?.installment_id || '');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(members[0]?.id || '');
  const [payAmount, setPayAmount] = useState('5000');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Cash');
  const [refNo, setRefNo] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit payment states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState('5000');
  const [editDate, setEditDate] = useState(new Date().toISOString().slice(0, 10));
  const [editMethod, setEditMethod] = useState<PaymentMethod>('Cash');
  const [editRefNo, setEditRefNo] = useState('');
  const [editStatus, setEditStatus] = useState<PaymentStatus>('Completed');
  const [editNotes, setEditNotes] = useState('');

  const activeMonth = months.find((m) => m.installment_id === selectedMonthId) || months[0];
  const activeMembers = allMonthMembers[selectedMonthId] || [];

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

  const handleEditPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !selectedPayment) return;
    setIsSubmitting(true);

    const formData = new FormData();
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

  const openPaymentModal = (mId?: string, defaultDue?: number) => {
    if (!isAdmin) return;
    if (mId) {
      setSelectedMemberId(mId);
      setPayAmount(defaultDue && defaultDue > 0 ? defaultDue.toString() : '5000');
    } else {
      setSelectedMemberId(members[0]?.id || '');
      setPayAmount('5000');
    }
    setIsPayModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_id', selectedMemberId);
    formData.append('installment_id', selectedMonthId);
    formData.append('amount', payAmount);
    formData.append('payment_date', new Date().toISOString().slice(0, 10));
    formData.append('payment_method', payMethod);
    formData.append('reference_number', refNo);
    formData.append('notes', notes);

    const res = await createPaymentAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Payment of ${formatINR(parseFloat(payAmount))} recorded!`);
      setIsPayModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
            <span>Monthly Collection Overview</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track month-by-month dues, collections, progress percentages, and member payment statuses
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => openPaymentModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* 10-Month Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {months.map((m) => {
          const isSelected = m.installment_id === selectedMonthId;

          return (
            <button
              key={m.installment_id}
              onClick={() => setSelectedMonthId(m.installment_id)}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Month #{m.month_number}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    m.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : m.status === 'In Progress'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {m.status}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                {m.month_name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Due: {m.due_date}</p>

              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Collected:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatINR(m.collected_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Expected:</span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {formatINR(m.expected_amount)}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${m.collection_percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-rose-600 dark:text-rose-400 font-mono">
                    Pending: {formatINR(m.pending_amount)}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {m.collection_percentage}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Month Detail & Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs">
                MONTH #{activeMonth?.month_number}
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {activeMonth?.month_name} Member Ledger
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Due Date: {activeMonth?.due_date} • Expected Total: {formatINR(activeMonth?.expected_amount || 0)}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Collected</span>
              <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {formatINR(activeMonth?.collected_amount || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pending</span>
              <span className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400">
                {formatINR(activeMonth?.pending_amount || 0)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Collection %</span>
              <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">
                {activeMonth?.collection_percentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Auction info banner */}
        {activeMonth?.auction && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/60 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <Gavel className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-700 dark:text-amber-400 block">
                  AUCTION WINNER: {(activeMonth.auction.winner_name || 'Member').toUpperCase()}
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Lifted Chit Amount: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatINR(activeMonth.auction.chit_value)}</strong>
                </p>
              </div>
            </div>
            <Link
              href="/auction"
              className="text-xs font-bold text-amber-700 dark:text-amber-300 underline hover:no-underline self-end sm:self-auto"
            >
              View Auction Details →
            </Link>
          </div>
        )}

        {/* Detailed Member Payment Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 pl-3 pr-2 w-12">#</th>
                <th className="py-3 px-3">Member Name</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Expected</th>
                <th className="py-3 px-3 text-right whitespace-nowrap">Paid</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Balance</th>
                <th className="py-3 px-4 whitespace-nowrap">Payment Date</th>
                <th className="py-3 px-3 whitespace-nowrap">Method</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                {isAdmin && <th className="py-3 pr-3 pl-2 text-right whitespace-nowrap">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {activeMembers.map((m) => (
                <tr key={m.member_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 pl-3 pr-2 font-mono font-bold text-slate-400 text-xs">
                    #{m.member_number}
                  </td>
                  <td className="py-3.5 px-3">
                    <Link
                      href={`/members/${m.member_id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors block"
                    >
                      {m.member_name}
                    </Link>
                    <span className="text-xs text-slate-400">{m.phone || 'No phone'}</span>
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {formatINR(m.expected_amount)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatINR(m.paid_amount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                    {formatINR(m.balance)}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                    {m.last_payment_date || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {m.last_payment_method || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <StatusBadge status={m.status} />
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 pr-3 pl-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {m.balance > 0 ? (
                          <button
                            onClick={() => openPaymentModal(m.member_id, m.balance)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all"
                          >
                            Collect
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        )}
                        {m.payments && m.payments.length > 0 && (
                          <button
                            onClick={() => openEditModal(m.payments[0])}
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

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title={`Record Payment for ${activeMonth?.month_name}`}
        description="Add a verified payment to the collection register"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => {
                setSelectedMemberId(e.target.value);
                const mem = activeMembers.find((m) => m.member_id === e.target.value);
                if (mem) {
                  setPayAmount(mem.balance > 0 ? mem.balance.toString() : mem.expected_amount.toString());
                }
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.member_number} - {m.name}
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
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Payment Method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI (GPay / PhonePe)</option>
                <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Reference / Receipt #
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/99120349 or REC-104"
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
        title="Edit Payment Record"
        description="Update transaction reference ID, date, method, or remarks"
      >
        <form onSubmit={handleEditPaymentSubmit} className="space-y-4">
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
              placeholder="e.g. UPI/99120349 or REC-104"
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
