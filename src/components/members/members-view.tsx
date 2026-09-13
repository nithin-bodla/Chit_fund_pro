'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MemberOverview } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { StatusBadge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import {
  createMemberAction,
  updateMemberAction,
  deleteMemberAction,
} from '@/actions/member-actions';
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  Trophy,
} from 'lucide-react';

interface MembersViewProps {
  members: MemberOverview[];
  isAdmin?: boolean;
}

export function MembersView({ members, isAdmin = false }: MembersViewProps) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberOverview | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formNumber, setFormNumber] = useState(1);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search) ||
      m.member_number.toString().includes(search)
  );

  const openAddModal = () => {
    // Next available slot number
    const maxNum = members.reduce((max, m) => Math.max(max, m.member_number), 0);
    setFormNumber(maxNum + 1);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    setFormStatus('active');
    setIsAddModalOpen(true);
  };

  const openEditModal = (member: MemberOverview) => {
    setSelectedMember(member);
    setFormNumber(member.member_number);
    setFormName(member.name);
    setFormPhone(member.phone);
    setFormEmail(member.email);
    setFormAddress(member.address);
    setFormNotes('');
    setFormStatus(member.status as 'active' | 'inactive');
    setIsEditModalOpen(true);
  };

  const openDeleteDialog = (member: MemberOverview) => {
    setSelectedMember(member);
    setIsDeleteDialogOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_number', formNumber.toString());
    formData.append('name', formName);
    formData.append('phone', formPhone);
    formData.append('email', formEmail);
    formData.append('address', formAddress);
    formData.append('notes', formNotes);

    const res = await createMemberAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Member #${formNumber} (${formName}) added successfully!`);
      setIsAddModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to add member');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('member_number', formNumber.toString());
    formData.append('name', formName);
    formData.append('phone', formPhone);
    formData.append('email', formEmail);
    formData.append('address', formAddress);
    formData.append('status', formStatus);
    formData.append('notes', formNotes);

    const res = await updateMemberAction(selectedMember.id, formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Member #${formNumber} details updated successfully!`);
      setIsEditModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to update member');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMember) return;
    setIsSubmitting(true);

    const res = await deleteMemberAction(selectedMember.id);
    setIsSubmitting(false);

    if (res.success) {
      toast.success(`Member #${selectedMember.member_number} deleted`);
      setIsDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to delete member');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Chit Group Members
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              {members.length} Enrolled
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            View member payment balances, edit contact details, or inspect transaction histories
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member by name, phone or slot #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          Showing {filteredMembers.length} of {members.length} members
        </div>
      </div>

      {/* Desktop Members Table */}
      <div className="hidden md:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
              <th className="py-3.5 pl-4 pr-2 w-12">#</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Name</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Phone</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Monthly Dues</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Total Paid</th>
              <th className="py-3.5 px-4 text-right whitespace-nowrap">Pending</th>
              <th className="py-3.5 px-3 whitespace-nowrap">Last Payment</th>
              <th className="py-3.5 px-3 text-center whitespace-nowrap">Status</th>
              <th className="py-3.5 text-right pr-4 pl-3 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No members enrolled yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Enroll your chit fund members to track their installments, lifted statuses, and ledger payments.
                  </p>
                  {isAdmin && (
                    <button
                      onClick={openAddModal}
                      className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add First Member</span>
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => (
              <tr
                key={m.id}
                className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <td className="py-4 pl-4 pr-2 font-mono font-bold text-slate-500 text-sm">
                  #{m.member_number}
                </td>
                <td className="py-4 px-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/members/${m.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 transition-colors whitespace-nowrap"
                    >
                      {m.name}
                    </Link>
                    {m.has_won_auction && (
                      <span
                        title={`Lifted chit in ${m.won_auction_month}`}
                        className="inline-flex items-center text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold whitespace-nowrap"
                      >
                        <Trophy className="w-3 h-3 mr-0.5" /> Lifted
                      </span>
                    )}
                  </div>
                  {m.email && <span className="text-xs text-slate-400 block truncate">{m.email}</span>}
                </td>
                <td className="py-4 px-3 text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {m.phone || '—'}
                </td>
                <td className="py-4 px-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  {formatINR(m.monthly_amount)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                  {formatINR(m.total_paid)}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                  {formatINR(m.total_pending)}
                </td>
                <td className="py-4 px-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                  {m.last_payment_date || 'No payment'}
                </td>
                <td className="py-4 px-3 text-center whitespace-nowrap">
                  <StatusBadge status={m.status_badge} />
                </td>
                <td className="py-4 text-right pr-4 pl-3 whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/members/${m.id}`}
                      title="View Ledger"
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEditModal(m)}
                          title="Edit Member"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteDialog(m)}
                          title="Delete Member"
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Mobile Members Cards View */}
      <div className="md:hidden space-y-3">
        {filteredMembers.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No members enrolled yet</p>
            {isAdmin && (
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add First Member</span>
              </button>
            )}
          </div>
        ) : (
          filteredMembers.map((m) => (
          <div
            key={m.id}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-400">
                  SLOT #{m.member_number}
                </span>
                <Link
                  href={`/members/${m.id}`}
                  className="font-bold text-slate-900 dark:text-white block hover:text-emerald-600 text-base"
                >
                  {m.name}
                </Link>
                {m.phone && <p className="text-xs text-slate-400">{m.phone}</p>}
              </div>
              <StatusBadge status={m.status_badge} />
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Monthly</span>
                <span className="font-semibold">{formatINR(m.monthly_amount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Total Paid</span>
                <span className="font-bold text-emerald-600">{formatINR(m.total_paid)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-sans">Pending</span>
                <span className="font-bold text-rose-600">{formatINR(m.total_pending)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Last: {m.last_payment_date || 'None'}
              </span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button
                    onClick={() => openEditModal(m)}
                    className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Edit
                  </button>
                )}
                <Link
                  href={`/members/${m.id}`}
                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Ledger
                </Link>
              </div>
            </div>
          </div>
        )))}
      </div>

      {/* Add Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Member Slot"
        description="Enroll a new member in the chit fund group"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Slot #
              </label>
              <input
                type="number"
                min="1"
                required
                value={formNumber}
                onChange={(e) => setFormNumber(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Rajesh Kumar"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                placeholder="member@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Address
            </label>
            <input
              type="text"
              placeholder="Door No, Street, City"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              placeholder="Remarks or references..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
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
              {isSubmitting ? 'Saving...' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit Member #${formNumber}`}
        description="Update member personal details and status"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Slot #
              </label>
              <input
                type="number"
                min="1"
                required
                value={formNumber}
                onChange={(e) => setFormNumber(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
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

      {/* Delete Member Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Member Slot"
        message={`Are you sure you want to delete member #${selectedMember?.member_number} (${selectedMember?.name})? All recorded payments associated with this member will also be removed.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
