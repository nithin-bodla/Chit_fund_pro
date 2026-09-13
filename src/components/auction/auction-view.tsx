'use client';

import React, { useState } from 'react';
import { Auction, Member, MonthlyInstallment, ChitGroup } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { StatCard } from '@/components/ui/stat-card';
import { useToast } from '@/components/ui/toast';
import { recordAuctionAction, deleteAuctionAction } from '@/actions/auction-actions';
import {
  Gavel,
  Trophy,
  Users,
  Coins,
  PlusCircle,
  Edit2,
  Trash2,
  Calendar,
  Wallet,
} from 'lucide-react';

interface AuctionViewProps {
  auctions: Auction[];
  members: Member[];
  installments: MonthlyInstallment[];
  group: ChitGroup;
  isAdmin?: boolean;
}

export function AuctionView({
  auctions,
  members,
  installments,
  group,
  isAdmin = false,
}: AuctionViewProps) {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formInstId, setFormInstId] = useState(installments[0]?.id || '');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formChitValue, setFormChitValue] = useState(group.monthly_base_amount?.toString() || '50000');
  const [formWinnerId, setFormWinnerId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Already won member IDs
  const wonMemberIds = new Set(auctions.map((a) => a.winner_member_id).filter(Boolean));
  const remainingMembers = members.filter((m) => !wonMemberIds.has(m.id));

  // Dynamic calculations
  const numericChitVal = parseFloat(formChitValue) || 0;
  const totalLiftDisbursed = auctions.reduce((sum, a) => sum + a.chit_value, 0);

  const openRecordModal = (instId?: string, existing?: Auction) => {
    if (existing) {
      setSelectedAuction(existing);
      setFormInstId(existing.installment_id);
      setFormDate(existing.auction_date);
      setFormChitValue(existing.chit_value.toString());
      setFormWinnerId(existing.winner_member_id || '');
      setFormNotes(existing.notes || '');
    } else {
      setSelectedAuction(null);
      setFormInstId(instId || installments[0]?.id || '');
      setFormDate(new Date().toISOString().slice(0, 10));
      setFormChitValue(group.monthly_base_amount?.toString() || '50000');
      setFormWinnerId(remainingMembers[0]?.id || members[0]?.id || '');
      setFormNotes('');
    }
    setIsModalOpen(true);
  };

  const openDeleteDialog = (auction: Auction) => {
    setSelectedAuction(auction);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('installment_id', formInstId);
    formData.append('auction_date', formDate);
    formData.append('chit_value', formChitValue);
    formData.append('winning_bid', '0');
    formData.append('winner_member_id', formWinnerId);
    formData.append('notes', formNotes);

    const res = await recordAuctionAction(formData);
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Auction / Lift recorded successfully!');
      setIsModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to save auction');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAuction) return;
    setIsSubmitting(true);

    const res = await deleteAuctionAction(selectedAuction.id);
    setIsSubmitting(false);

    if (res.success) {
      toast.success('Auction entry deleted');
      setIsDeleteDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to delete auction');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Gavel className="w-7 h-7 text-emerald-600" />
            <span>Auction / Lift Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Record monthly chit lifts, winner disbursements, and member lift tracking
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => openRecordModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-sm self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Auction</span>
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Auctions Completed"
          value={`${auctions.length} of 10`}
          subtitle={`${10 - auctions.length} Months remaining`}
          accentColor="purple"
          icon={<Gavel className="w-6 h-6" />}
        />
        <StatCard
          title="Total Lift Disbursed"
          value={formatINR(totalLiftDisbursed)}
          subtitle="Disbursed to winning members"
          accentColor="emerald"
          icon={<Wallet className="w-6 h-6" />}
        />
        <StatCard
          title="Remaining Lifts"
          value={`${10 - auctions.length} Months`}
          subtitle="Chit cycles to be conducted"
          accentColor="amber"
          icon={<Calendar className="w-6 h-6" />}
        />
        <StatCard
          title="Eligible Lift Members"
          value={`${remainingMembers.length} Members`}
          subtitle="Not yet taken auction"
          accentColor="blue"
          icon={<Users className="w-6 h-6" />}
        />
      </div>

      {/* Monthly Auction Schedule & Results */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Monthly Auction Register ({installments.length} Months)
          </h2>
          <p className="text-xs text-slate-400">
            Monthly chit lift records, winning members, and disbursement status
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 pl-3 pr-2 whitespace-nowrap">Month</th>
                <th className="py-3 px-3 whitespace-nowrap">Auction Date</th>
                <th className="py-3 px-3 whitespace-nowrap">Winner</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Chit Value / Payout</th>
                <th className="py-3 px-3 text-center whitespace-nowrap">Status</th>
                {isAdmin && <th className="py-3 pr-3 pl-2 text-right whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {installments.map((inst) => {
                const auction = auctions.find((a) => a.installment_id === inst.id);
                const hasAuction = Boolean(auction);

                return (
                  <tr
                    key={inst.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 pl-3 pr-2 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      Month {inst.month_number} ({inst.month_name})
                    </td>
                    <td className="py-3.5 px-3 text-xs font-mono text-slate-500 whitespace-nowrap">
                      {auction ? auction.auction_date : '—'}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {auction ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                          <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>
                            #{auction.winner_number} {auction.winner_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-normal">Pending Auction</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatINR(auction ? auction.chit_value : group.monthly_base_amount)}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          hasAuction
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {hasAuction ? 'Lifted' : 'Upcoming'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 pr-3 pl-2 text-right whitespace-nowrap">
                        {hasAuction && auction ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openRecordModal(inst.id, auction)}
                              title="Edit Auction"
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openDeleteDialog(auction)}
                              title="Delete Auction"
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openRecordModal(inst.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all"
                          >
                            Record
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Eligible Members Ready for Upcoming Auctions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Eligible Members for Next Auctions ({remainingMembers.length})
          </h2>
          <p className="text-xs text-slate-400">
            Members who have not lifted the chit yet in this chit fund cycle
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {remainingMembers.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block">
                  SLOT #{m.member_number}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  {m.name}
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Record / Edit Auction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedAuction ? 'Edit Auction Record' : 'Record Monthly Auction / Lift'}
        description="Record chit lift winner and payout amount"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Select Month
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
                Auction Date
              </label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Total Chit Value (₹)
              </label>
              <input
                type="number"
                step="1"
                required
                value={formChitValue}
                onChange={(e) => setFormChitValue(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Winner Member
            </label>
            <select
              value={formWinnerId}
              onChange={(e) => setFormWinnerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none"
            >
              <option value="">Select Winner...</option>
              {members.map((m) => {
                const alreadyWon = wonMemberIds.has(m.id) && m.id !== selectedAuction?.winner_member_id;
                return (
                  <option key={m.id} value={m.id}>
                    #{m.member_number} - {m.name} {alreadyWon ? '(Already Lifted)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Dynamic Financial Preview Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20">
            <p className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 mb-1">
              Disbursement Details
            </p>
            <div className="text-xs font-mono">
              <span className="text-slate-500 block text-[10px] font-sans">Amount Received by Winner</span>
              <span className="font-bold text-slate-900 dark:text-white text-base">
                {formatINR(numericChitVal)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Auction details or special conditions..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Confirm Auction'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Auction Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Auction Record"
        message={`Are you sure you want to delete the auction record for Month ${selectedAuction?.month_number}? This will reset the lifted status for winner ${selectedAuction?.winner_name}.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}
