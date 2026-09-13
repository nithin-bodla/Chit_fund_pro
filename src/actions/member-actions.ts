'use server';

import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getMemberOverviewList,
  getPayments,
  getInstallments,
  getChitGroup,
  getAuctions,
  getMemberExpectedAmountForMonth,
} from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { calculateBalance, getPaymentStatus } from '@/lib/currency';
import { revalidatePath } from 'next/cache';

export async function getMembersListAction() {
  await requireAdmin();
  return await getMembers();
}

export async function getMemberOverviewAction() {
  await requireAdmin();
  return await getMemberOverviewList();
}

export async function getMemberDetailsAction(memberId: string) {
  await requireAdmin();

  const [member, group, installments, allPayments, auctions] = await Promise.all([
    getMemberById(memberId),
    getChitGroup(),
    getInstallments(),
    getPayments({ member_id: memberId }),
    getAuctions(),
  ]);

  if (!member) {
    return { success: false, error: 'Member not found' };
  }

  // Build monthly ledger for this member
  const monthLedger = installments.map((inst) => {
    const monthPayments = allPayments.filter((p) => p.installment_id === inst.id);
    const totalPaid = monthPayments.reduce((acc, p) => acc + p.amount, 0);
    const expected = getMemberExpectedAmountForMonth(member.id, inst, group, auctions);
    const balance = calculateBalance(expected, totalPaid);
    const status = getPaymentStatus(expected, totalPaid);

    const latestPayment = monthPayments.sort(
      (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
    )[0];

    return {
      installment_id: inst.id,
      month_number: inst.month_number,
      month_name: inst.month_name,
      due_date: inst.due_date,
      expected_amount: expected,
      paid_amount: totalPaid,
      balance,
      status,
      last_payment_date: latestPayment?.payment_date || null,
      last_payment_method: latestPayment?.payment_method || null,
      reference_number: latestPayment?.reference_number || null,
      payments: monthPayments,
    };
  });

  const totalExpected = monthLedger.reduce((acc, m) => acc + m.expected_amount, 0);
  const totalPaid = allPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalPending = Math.max(0, totalExpected - totalPaid);

  const sortedPayments = [...allPayments].sort(
    (a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime()
  );

  const wonAuction = auctions.find((a) => a.winner_member_id === memberId);

  return {
    success: true,
    data: {
      member,
      summary: {
        total_expected: totalExpected,
        total_paid: totalPaid,
        total_pending: totalPending,
        payment_count: allPayments.length,
        last_payment_date: sortedPayments[0]?.payment_date || null,
        won_auction: wonAuction || null,
      },
      ledger: monthLedger,
      payments: sortedPayments,
    },
  };
}

export async function createMemberAction(formData: FormData) {
  await requireAdmin();

  const group = await getChitGroup();
  const memberNumber = parseInt(formData.get('member_number') as string, 10);
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || '';
  const email = (formData.get('email') as string)?.trim() || '';
  const address = (formData.get('address') as string)?.trim() || '';
  const notes = (formData.get('notes') as string)?.trim() || '';
  const joinedDate = (formData.get('joined_date') as string) || new Date().toISOString().slice(0, 10);

  if (!name || isNaN(memberNumber)) {
    return { success: false, error: 'Member number and name are required' };
  }

  try {
    const member = await createMember({
      chit_group_id: group.id,
      member_number: memberNumber,
      name,
      phone,
      email,
      address,
      status: 'active',
      joined_date: joinedDate,
      notes,
    });

    revalidatePath('/members');
    revalidatePath('/');
    return { success: true, data: member };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to create member' };
  }
}

export async function updateMemberAction(memberId: string, formData: FormData) {
  await requireAdmin();

  const memberNumber = parseInt(formData.get('member_number') as string, 10);
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || '';
  const email = (formData.get('email') as string)?.trim() || '';
  const address = (formData.get('address') as string)?.trim() || '';
  const status = (formData.get('status') as 'active' | 'inactive') || 'active';
  const notes = (formData.get('notes') as string)?.trim() || '';
  const joinedDate = formData.get('joined_date') as string;

  if (!name || isNaN(memberNumber)) {
    return { success: false, error: 'Member number and name are required' };
  }

  try {
    const updated = await updateMember(memberId, {
      member_number: memberNumber,
      name,
      phone,
      email,
      address,
      status,
      notes,
      ...(joinedDate ? { joined_date: joinedDate } : {}),
    });

    revalidatePath('/members');
    revalidatePath(`/members/${memberId}`);
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update member' };
  }
}

export async function deleteMemberAction(memberId: string) {
  await requireAdmin();

  try {
    const success = await deleteMember(memberId);
    if (!success) return { success: false, error: 'Could not delete member' };

    revalidatePath('/members');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete member' };
  }
}
