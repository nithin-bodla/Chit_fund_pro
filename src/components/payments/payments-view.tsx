'use client';

import React, { useState } from 'react';
import { Payment, Member, MonthlyInstallment, PaymentMethod, PaymentStatus } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  createPaymentAction,
  updatePaymentAction,
  deletePaymentAction,
} from '@/actions/payment-actions';
import {
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  User,
  ArrowUpDown,
} from 'lucide-react';

interface PaymentsViewProps {
  initialPayments: Payment[];
  members: Member[];
  installments: MonthlyInstallment[];
  isAdmin?: boolean;
}

export function PaymentsView({
  initialPayments,
  members,
  installments,
  isAdmin = false,
}: PaymentsViewProps) {
  const toast = useToast();

  // Filters state
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterMember, setFilterMember] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formMemberId, setFormMemberId] = useState(members[0]?.id || '');
  const [formInstId, setFormInstId] = useState(installments[0]?.id || '');
  const [formAmount, setFormAmount] = useState('5000');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formMethod, setFormMethod] = useState<PaymentMethod>('UPI');
  const [formRefNo, setFormRefNo] = useState('');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('Completed');
  const [formNotes, setFormNotes] = useState('');

  // Filtered Payments
  const filteredPayments = initialPayments.filter((p) => {
    if (filterMonth !== 'all' && p.installment_id !== filterMonth) return false;
    if (filterMember !== 'all' && p.member_id !== filterMember) return false;
    if (filterMethod !== 'all' && p.payment_method !== filterMethod) return false;
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.member_name?.toLowerCase().includes(q);
      const matchRef = p.reference_number?.toLowerCase().includes(q);
      const matchNotes = p.notes?.toLowerCase().includes(q);
      if (!matchName && !matchRef && !matchNotes) return false;
    }
    return true;
  });

  const totalFilteredAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const openAddModal = () => {
    setFormMemberId(members[0]?.id || '');
    setFormInstId(installments[0]?.id || '');
    setFormAmount('5000');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormMethod('UPI');
    setFormRefNo('');
    setFormStatus('Completed');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormMemberId(payment.member_id);
    setFormInstId(payment.installment_id);
    setFormAmount(payment.amount.toString());
    setFormDate(payment.payment_date);
    setFormMethod(payment.payment_method);
    setFormRefNo(payment.reference_number || '');
    setFormStatus(payment.status);
    setFormNotes(payment.notes || '');
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_id', formMemberId);
    formData.append('installment_id', formInstId);
    formData.append('amount', formAmount);
    formData.append('payment_date', formDate);
    formData.append('payment_method', formMethod);
    formData.append('reference_number', formRefNo);
    formData.append('status', formStatus);
    formData.append('notes', formNotes);

    const res = await createPaymentAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Payment of ${formatINR(parseFloat(formAmount))} recorded!`);
      setIsAddModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_id', formMemberId);
    formData.append('installment_id', formInstId);
    formData.append('amount', formAmount);
    formData.append('payment_date', formDate);
    formData.append('payment_method', formMethod);
    formData.append('reference_number', formRefNo);
    formData.append('status', formStatus);
    formData.append('notes', formNotes);

    const res = await updatePaymentAction(selectedPayment.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Payment updated successfully');
      setIsEditModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to update payment');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPayment) return;
    setIsSubmitting(true);

    const res = await deletePaymentAction(selectedPayment.id);
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Payment record deleted');
      setIsDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to delete payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            <span>Payments Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, filter, edit, and record transactions for all chit fund members
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member name, txn ref, remarks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
            >
              <option value="all">All Months</option>
              {installments.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  Month {inst.month_number} ({inst.month_name})
                </option>
              ))}
            </select>
          </div>

          {/* Member Filter */}
          <div>
            <select
              value={filterMember}
              onChange={(e) => setFilterMember(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
            >
              <option value="all">All Members</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.member_number} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
            >
              <option value="all">All Methods</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Ledger Summary Stats */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">
              Matching Records: <strong className="text-slate-900 dark:text-white font-mono">{filteredPayments.length}</strong>
            </span>
            <span className="text-slate-500">
              Filtered Total: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">{formatINR(totalFilteredAmount)}</strong>
            </span>
          </div>

          {(search || filterMonth !== 'all' || filterMember !== 'all' || filterMethod !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setFilterMonth('all');
                setFilterMember('all');
                setFilterMethod('all');
                setFilterStatus('all');
              }}
              className="text-emerald-600 hover:underline font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop Payments Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
              <th className="py-3.5 pl-4 pr-3 whitespace-nowrap">Date</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Member</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Month</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Amount</th>
              <th className="py-3.5 px-4 whitespace-nowrap">Method</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Reference / Txn ID</th>
              <th className="py-3.5 px-3">Remarks</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Status</th>
              {isAdmin && <th className="py-3.5 text-right pr-4 pl-3 whitespace-nowrap">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="py-12 text-center text-slate-400">
                  No payment entries match the selected filters.
                </td>
              </tr>
            ) : (
              filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 pl-4 pr-3 font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {p.payment_date}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <span className="text-slate-400 font-mono font-normal mr-1.5">
                      #{p.member_number}
                    </span>
                    {p.member_name}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {p.month_name}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    {formatINR(p.amount)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                    {p.payment_method}
                  </td>
                  <td className="py-3.5 px-3 text-xs font-mono text-slate-500 truncate max-w-[140px]">
                    {p.reference_number || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-xs text-slate-400 truncate max-w-[160px]">
                    {p.notes || '—'}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-500/20">
                      {p.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 text-right pr-4 pl-3 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(p)}
                          title="Edit Payment"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(p)}
                          title="Delete Payment"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Payments Cards View */}
      <div className="md:hidden space-y-3">
        {filteredPayments.map((p) => (
          <div
            key={p.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  #{p.member_number} • {p.month_name}
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {p.member_name}
                </span>
              </div>
              <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {formatINR(p.amount)}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 font-mono py-1 border-y border-slate-100 dark:border-slate-800">
              <span>Date: {p.payment_date}</span>
              <span>Method: {p.payment_method}</span>
            </div>

            {p.reference_number && (
              <p className="text-[11px] font-mono text-slate-400 truncate">
                Ref: {p.reference_number}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">{p.notes || 'No remarks'}</span>
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(p)}
                    className="px-2.5 py-1 text-xs text-blue-600 font-medium hover:bg-blue-50 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteDialog(p)}
                    className="px-2.5 py-1 text-xs text-rose-600 font-medium hover:bg-rose-50 rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Record Member Payment"
        description="Add a new transaction to the chit fund ledger"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Select Member
            </label>
            <select
              value={formMemberId}
              onChange={(e) => setFormMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.member_number} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Month Installment
            </label>
            <select
              value={formInstId}
              onChange={(e) => setFormInstId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none"
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
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
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
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
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
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
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
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
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
              value={formRefNo}
              onChange={(e) => setFormRefNo(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Remarks..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Payment Record"
        description="Update transaction details"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Member
              </label>
              <select
                value={formMemberId}
                onChange={(e) => setFormMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    #{m.member_number} - {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Installment Month
              </label>
              <select
                value={formInstId}
                onChange={(e) => setFormInstId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              >
                {installments.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    Month {inst.month_number} ({inst.month_name})
                  </option>
                ))}
              </select>
            </div>
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
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
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
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
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
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
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
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
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
              value={formRefNo}
              onChange={(e) => setFormRefNo(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
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
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Payment Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Payment Record"
        message={`Are you sure you want to delete this payment of ${selectedPayment ? formatINR(selectedPayment.amount) : ''} for ${selectedPayment?.member_name}?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
