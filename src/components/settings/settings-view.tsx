'use client';

import React, { useState } from 'react';
import { ChitGroup, MonthlyInstallment, User } from '@/lib/types';
import { formatINR } from '@/lib/currency';
import { useToast } from '@/components/ui/toast';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  updateChitSettingsAction,
  updateInstallmentAction,
  createInstallmentAction,
  deleteInstallmentAction,
  reseedDatabaseAction,
  clearAllDataAction,
} from '@/actions/settings-actions';
import {
  createAdminUserAction,
  updateAdminUserAction,
  deleteAdminUserAction,
  updateMyCredentialsAction,
} from '@/actions/auth-actions';
import {
  Settings,
  Database,
  Lock,
  Calendar,
  Save,
  RefreshCw,
  PlusCircle,
  Trash2,
  Edit2,
  Server,
  Coins,
  ShieldCheck,
  UserPlus,
  Users,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';

interface SettingsViewProps {
  group: ChitGroup;
  installments: MonthlyInstallment[];
  dbHealth: {
    connected: boolean;
    isNeon: boolean;
    latencyMs: number;
    tableCounts: Record<string, number>;
  };
  users?: User[];
  currentUsername?: string;
  currentUserId?: string;
}

export function SettingsView({
  group,
  installments,
  dbHealth,
  users = [],
  currentUsername = 'admin',
  currentUserId,
}: SettingsViewProps) {
  const toast = useToast();

  // Chit group settings form
  const [name, setName] = useState(group.name);
  const [totalMembers, setTotalMembers] = useState(group.total_members.toString());
  const [baseAmount, setBaseAmount] = useState(group.monthly_base_amount.toString());
  const [regularAmount, setRegularAmount] = useState(
    (group.regular_member_monthly_amount || 5000).toString()
  );
  const [afterLiftAmount, setAfterLiftAmount] = useState(
    (group.after_lift_monthly_amount || 6000).toString()
  );
  const [startDate, setStartDate] = useState(group.start_date);
  const [endDate, setEndDate] = useState(group.end_date);
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  // Profile credentials form
  const [profileUsername, setProfileUsername] = useState(currentUsername);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Multi-admin state
  const [isAddAdminModalOpen, setIsAddAdminModalOpen] = useState(false);
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirm, setNewAdminConfirm] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Edit admin credentials modal state
  const [adminToEdit, setAdminToEdit] = useState<User | null>(null);
  const [editAdminUsername, setEditAdminUsername] = useState('');
  const [editAdminPassword, setEditAdminPassword] = useState('');
  const [isSavingEditAdmin, setIsSavingEditAdmin] = useState(false);

  // Delete admin confirmation
  const [adminToDelete, setAdminToDelete] = useState<User | null>(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);

  // Edit single installment modal
  const [selectedInst, setSelectedInst] = useState<MonthlyInstallment | null>(null);
  const [instExpected, setInstExpected] = useState('');
  const [instDueDate, setInstDueDate] = useState('');
  const [instMonthName, setInstMonthName] = useState('');
  const [instNotes, setInstNotes] = useState('');
  const [isSavingInst, setIsSavingInst] = useState(false);

  // Add new installment modal
  const [isAddInstModalOpen, setIsAddInstModalOpen] = useState(false);
  const [newMonthNumber, setNewMonthNumber] = useState(installments.length + 1);
  const [newMonthName, setNewMonthName] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newExpectedAmount, setNewExpectedAmount] = useState(group.monthly_base_amount.toString());
  const [newNotes, setNewNotes] = useState('');
  const [isAddingInst, setIsAddingInst] = useState(false);

  // Delete installment confirmation
  const [instToDelete, setInstToDelete] = useState<MonthlyInstallment | null>(null);
  const [isDeletingInst, setIsDeletingInst] = useState(false);

  // Reseed dialog
  const [isReseedDialogOpen, setIsReseedDialogOpen] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  // Clear all data dialog
  const [isClearDataDialogOpen, setIsClearDataDialogOpen] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);

  const handleSaveChitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGroup(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('total_members', totalMembers);
    formData.append('monthly_base_amount', baseAmount);
    formData.append('regular_member_monthly_amount', regularAmount);
    formData.append('after_lift_monthly_amount', afterLiftAmount);
    formData.append('start_date', startDate);
    formData.append('end_date', endDate);

    const res = await updateChitSettingsAction(formData);
    setIsSavingGroup(false);

    if (res.success) {
      toast.success('Chit parameters updated successfully!');
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to update settings');
    }
  };

  const handleSaveProfileCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    const formData = new FormData();
    formData.append('username', profileUsername);
    formData.append('currentPassword', currentPassword);
    formData.append('newPassword', newPassword);
    formData.append('confirmPassword', confirmPassword);

    const res = await updateMyCredentialsAction(formData);
    setIsSavingProfile(false);

    if (res.success) {
      toast.success(res.message || 'Profile credentials updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to update credentials');
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingAdmin(true);

    const formData = new FormData();
    formData.append('username', newAdminUsername);
    formData.append('password', newAdminPassword);
    formData.append('confirmPassword', newAdminConfirm);

    const res = await createAdminUserAction(formData);
    setIsAddingAdmin(false);

    if (res.success) {
      toast.success(res.message || 'Admin account created successfully!');
      setIsAddAdminModalOpen(false);
      setNewAdminUsername('');
      setNewAdminPassword('');
      setNewAdminConfirm('');
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to create admin');
    }
  };

  const openEditAdminModal = (user: User) => {
    setAdminToEdit(user);
    setEditAdminUsername(user.username);
    setEditAdminPassword('');
  };

  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToEdit) return;
    setIsSavingEditAdmin(true);

    const formData = new FormData();
    formData.append('username', editAdminUsername);
    if (editAdminPassword.trim()) {
      formData.append('newPassword', editAdminPassword);
    }

    const res = await updateAdminUserAction(adminToEdit.id, formData);
    setIsSavingEditAdmin(false);

    if (res.success) {
      toast.success(res.message || 'Admin credentials updated successfully!');
      setAdminToEdit(null);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to update admin');
    }
  };

  const handleDeleteAdminConfirm = async () => {
    if (!adminToDelete) return;
    setIsDeletingAdmin(true);

    const res = await deleteAdminUserAction(adminToDelete.id);
    setIsDeletingAdmin(false);

    if (res.success) {
      toast.success(res.message || 'Admin account deleted');
      setAdminToDelete(null);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to delete admin');
    }
  };

  const openEditInstModal = (inst: MonthlyInstallment) => {
    setSelectedInst(inst);
    setInstExpected(inst.expected_amount.toString());
    setInstDueDate(inst.due_date);
    setInstMonthName(inst.month_name);
    setInstNotes(inst.notes || '');
  };

  const handleSaveInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInst) return;
    setIsSavingInst(true);

    const formData = new FormData();
    formData.append('expected_amount', instExpected);
    formData.append('due_date', instDueDate);
    formData.append('month_name', instMonthName);
    formData.append('notes', instNotes);

    const res = await updateInstallmentAction(selectedInst.id, formData);
    setIsSavingInst(false);

    if (res.success) {
      toast.success(`Installment for ${instMonthName} updated!`);
      setSelectedInst(null);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to update installment');
    }
  };

  const openAddInstModal = () => {
    const maxNum = installments.reduce((max, i) => Math.max(max, i.month_number), 0);
    setNewMonthNumber(maxNum + 1);
    setNewMonthName('');
    setNewDueDate('');
    setNewExpectedAmount(baseAmount || '50000');
    setNewNotes('');
    setIsAddInstModalOpen(true);
  };

  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingInst(true);

    const formData = new FormData();
    formData.append('month_number', newMonthNumber.toString());
    formData.append('month_name', newMonthName);
    formData.append('due_date', newDueDate);
    formData.append('expected_amount', newExpectedAmount);
    formData.append('notes', newNotes);

    const res = await createInstallmentAction(formData);
    setIsAddingInst(false);

    if (res.success) {
      toast.success(`Month ${newMonthNumber} (${newMonthName}) added!`);
      setIsAddInstModalOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to add month');
    }
  };

  const handleDeleteInstConfirm = async () => {
    if (!instToDelete) return;
    setIsDeletingInst(true);

    const res = await deleteInstallmentAction(instToDelete.id);
    setIsDeletingInst(false);

    if (res.success) {
      toast.success(`Month ${instToDelete.month_number} removed`);
      setInstToDelete(null);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to delete installment');
    }
  };

  const handleReseedConfirm = async () => {
    setIsReseeding(true);
    const res = await reseedDatabaseAction();
    setIsReseeding(false);

    if (res.success) {
      toast.success('Database reset with clean initial chit fund parameters!');
      setIsReseedDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to reset database');
    }
  };

  const handleClearAllDataConfirm = async () => {
    setIsClearingData(true);
    const res = await clearAllDataAction();
    setIsClearingData(false);

    if (res.success) {
      toast.success(res.message || 'All records cleared successfully! Ready for your new data.');
      setIsClearDataDialogOpen(false);
      window.location.reload();
    } else {
      toast.error(res.error || 'Failed to clear records');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-emerald-600" />
          <span>System & Chit Settings</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure chit rules, dynamic monthly installment amounts, admin security, and database status
        </p>
      </div>

      {/* 1. Chit Fund Core Configuration Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Chit Group Parameters
            </h2>
            <p className="text-xs text-slate-400">
              Configure total enrolled members, base pool amount, regular monthly dues, and post-lift amounts
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveChitSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Chit Group Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Total Members (Configurable)
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalMembers}
                onChange={(e) => setTotalMembers(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Can be increased or adjusted anytime</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Monthly Base Pool Amount (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={baseAmount}
                onChange={(e) => setBaseAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Every Month Member Due (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={regularAmount}
                onChange={(e) => setRegularAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Default monthly installment per member</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                After Lift Monthly Due (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={afterLiftAmount}
                onChange={(e) => setAfterLiftAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">Monthly amount due after lifting chit</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSavingGroup}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all text-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingGroup ? 'Saving...' : 'Save Parameters'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Monthly Installments Configuration Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>Configurable Monthly Installments ({installments.length} Months)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Add new monthly cycles or adjust amounts dynamically as your chit fund scales
            </p>
          </div>

          <button
            onClick={openAddInstModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Month</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <th className="py-3 pl-3 w-14">#</th>
                <th className="py-3 px-3">Month Name</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-6 text-right whitespace-nowrap">Expected Amount</th>
                <th className="py-3 px-6 text-left">Notes</th>
                <th className="py-3 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {installments.map((inst) => (
                <tr key={inst.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 pl-3 font-mono font-bold text-slate-400 text-xs">
                    #{inst.month_number}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                    {inst.month_name}
                  </td>
                  <td className="py-3.5 px-3 text-xs font-mono text-slate-500">
                    {inst.due_date}
                  </td>
                  <td className="py-3.5 px-6 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">
                    {formatINR(inst.expected_amount)}
                  </td>
                  <td className="py-3.5 px-6 text-xs text-slate-400 truncate max-w-[220px]">
                    {inst.notes || '—'}
                  </td>
                  <td className="py-3.5 pr-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openEditInstModal(inst)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Edit
                      </button>
                      {installments.length > 1 && (
                        <button
                          onClick={() => setInstToDelete(inst)}
                          title="Remove Month"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Admin Accounts & Credentials Management */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Admin Accounts & Credentials
            </h2>
            <p className="text-xs text-slate-400">
              Manage your personal admin username, update passwords, and configure multiple admin accounts with separate credentials
            </p>
          </div>
        </div>

        {/* Section A: Current Active Admin Profile */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-emerald-600" />
                <span>Your Active Admin Profile</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Update your login username and change your personal password
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-mono">
              @{currentUsername}
            </span>
          </div>

          <form onSubmit={handleSaveProfileCredentials} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  value={profileUsername}
                  onChange={(e) => setProfileUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This username is used to log in at /admin
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Current Password (Required)
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Verify current password to authorize changes
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all text-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Credentials'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section B: Multi-Admin Accounts List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                <span>Authorized Admin Users ({users.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add two or more admins with separate credentials. Each admin can log in independently.
              </p>
            </div>

            <button
              onClick={() => setIsAddAdminModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Admin</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <th className="py-3 pl-4 pr-3">Admin Username</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 pr-4 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {users.map((u) => {
                  const isCurrent = u.username.toLowerCase() === currentUsername.toLowerCase() || u.id === currentUserId;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 pl-4 pr-3 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <span>@{u.username}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                              Active Session
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-500/20 uppercase">
                          {u.role}
                        </span>
                      </td>
                      <td suppressHydrationWarning className="py-3.5 px-3 text-xs font-mono text-slate-400 whitespace-nowrap">
                        {u.created_at ? (u.created_at.length >= 10 ? u.created_at.slice(0, 10) : u.created_at) : '—'}
                      </td>
                      <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditAdminModal(u)}
                            title="Edit Credentials"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setAdminToDelete(u)}
                            disabled={isCurrent || users.length <= 1}
                            title={
                              isCurrent
                                ? 'Cannot delete active session account'
                                : users.length <= 1
                                ? 'Cannot delete only admin account'
                                : 'Delete Admin'
                            }
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Database Connection Status & Seeding */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-xl">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Database Health & Seed Trigger
            </h2>
            <p className="text-xs text-slate-400">
              Neon PostgreSQL serverless status and administrative reset utilities
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Engine Status
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  dbHealth.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {dbHealth.isNeon ? 'Neon Cloud PostgreSQL' : 'Local Fallback Store'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ping Latency: <strong className="text-emerald-600 font-mono">{dbHealth.latencyMs}ms</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 sm:col-span-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Table Record Counts
            </span>
            <div className="grid grid-cols-4 gap-2 text-xs font-mono text-slate-700 dark:text-slate-300">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Groups</span>
                <span className="font-bold">{dbHealth.tableCounts.chit_groups || 1}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Members</span>
                <span className="font-bold">{dbHealth.tableCounts.members || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Payments</span>
                <span className="font-bold">{dbHealth.tableCounts.payments || 0}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block font-sans">Installments</span>
                <span className="font-bold">{installments.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Need to reset initial baseline?</p>
            <p className="text-[11px] text-slate-400">
              Re-populates default member slots and initial installment calendar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsClearDataDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800 font-bold rounded-xl text-xs hover:bg-amber-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Data (Clean Slate)</span>
            </button>
            <button
              onClick={() => setIsReseedDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-bold rounded-xl text-xs hover:bg-rose-100 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset & Reseed Baseline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Edit Installment Modal */}
      {selectedInst && (
        <Modal
          isOpen={Boolean(selectedInst)}
          onClose={() => setSelectedInst(null)}
          title={`Edit Month ${selectedInst.month_number} (${selectedInst.month_name})`}
          description="Configure monthly installment amount and schedule"
        >
          <form onSubmit={handleSaveInstallment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Month Name
              </label>
              <input
                type="text"
                required
                value={instMonthName}
                onChange={(e) => setInstMonthName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Expected Amount (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={instExpected}
                  onChange={(e) => setInstExpected(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  required
                  value={instDueDate}
                  onChange={(e) => setInstDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={instNotes}
                onChange={(e) => setInstNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedInst(null)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingInst}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {isSavingInst ? 'Saving...' : 'Save Amount'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Installment Modal */}
      <Modal
        isOpen={isAddInstModalOpen}
        onClose={() => setIsAddInstModalOpen(false)}
        title="Add Installment Month"
        description="Expand the chit fund tenure by adding a new installment cycle"
      >
        <form onSubmit={handleAddInstallment} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Month #
              </label>
              <input
                type="number"
                min="1"
                required
                value={newMonthNumber}
                onChange={(e) => setNewMonthNumber(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Month Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. July or Month 11"
                value={newMonthName}
                onChange={(e) => setNewMonthName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Expected Amount (₹)
              </label>
              <input
                type="number"
                step="1"
                required
                value={newExpectedAmount}
                onChange={(e) => setNewExpectedAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Installment notes..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddInstModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingInst}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {isAddingInst ? 'Adding...' : 'Add Installment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Installment Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(instToDelete)}
        onClose={() => setInstToDelete(null)}
        onConfirm={handleDeleteInstConfirm}
        title="Remove Month Installment"
        message={`Are you sure you want to remove Month ${instToDelete?.month_number} (${instToDelete?.month_name})? Any payments assigned to this month will also be removed.`}
        isLoading={isDeletingInst}
      />

      {/* Reseed Database Confirmation */}
      <ConfirmDialog
        isOpen={isReseedDialogOpen}
        onClose={() => setIsReseedDialogOpen(false)}
        onConfirm={handleReseedConfirm}
        title="Reset Baseline Data"
        message="This will re-populate the baseline chit fund structure (September to June) and reset payments. Are you sure?"
        confirmText="Yes, Reset Baseline"
        isLoading={isReseeding}
      />

      {/* Add New Admin Modal */}
      <Modal
        isOpen={isAddAdminModalOpen}
        onClose={() => setIsAddAdminModalOpen(false)}
        title="Create New Admin Account"
        description="Add an additional administrator with independent login credentials"
      >
        <form onSubmit={handleCreateAdmin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Admin Username
            </label>
            <input
              type="text"
              required
              placeholder="e.g. partner_admin"
              value={newAdminUsername}
              onChange={(e) => setNewAdminUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Letters, numbers, underscores, or dashes (min 3 chars)
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="At least 6 characters"
              value={newAdminPassword}
              onChange={(e) => setNewAdminPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              placeholder="Repeat password"
              value={newAdminConfirm}
              onChange={(e) => setNewAdminConfirm(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddAdminModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAddingAdmin}
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md disabled:opacity-50"
            >
              {isAddingAdmin ? 'Creating...' : 'Create Admin Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Admin Modal */}
      {adminToEdit && (
        <Modal
          isOpen={Boolean(adminToEdit)}
          onClose={() => setAdminToEdit(null)}
          title={`Edit Admin @${adminToEdit.username}`}
          description="Update username or reset password for this admin account"
        >
          <form onSubmit={handleSaveEditAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={editAdminUsername}
                onChange={(e) => setEditAdminUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Reset Password (Optional)
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep existing password"
                value={editAdminPassword}
                onChange={(e) => setEditAdminPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Only fill if you want to set a new password for this admin
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setAdminToEdit(null)}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEditAdmin}
                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {isSavingEditAdmin ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Admin Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(adminToDelete)}
        onClose={() => setAdminToDelete(null)}
        onConfirm={handleDeleteAdminConfirm}
        title="Delete Admin Account"
        message={`Are you sure you want to permanently delete admin account @${adminToDelete?.username}? They will no longer be able to log in to the administrative portal.`}
        confirmText="Delete Admin"
        isDestructive={true}
        isLoading={isDeletingAdmin}
      />

      {/* Clear All Data Confirmation */}
      <ConfirmDialog
        isOpen={isClearDataDialogOpen}
        onClose={() => setIsClearDataDialogOpen(false)}
        onConfirm={handleClearAllDataConfirm}
        title="Clear All Members & Transactions?"
        message="Are you sure you want to wipe all members, payments, and auctions? This will give you a completely clean chit fund ledger so you can add your real members and transactions. Your admin login account will be preserved."
        confirmText="Clear All Data"
        isDestructive={true}
        isLoading={isClearingData}
      />
    </div>
  );
}
