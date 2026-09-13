'use server';

import {
  getAuctions,
  createOrUpdateAuction,
  deleteAuction,
  getChitGroup,
  getMembers,
} from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { fromPaise, toPaise } from '@/lib/currency';
import { revalidatePath } from 'next/cache';

export async function getAuctionsAction() {
  await requireAdmin();
  return await getAuctions();
}

export async function recordAuctionAction(formData: FormData) {
  await requireAdmin();

  const group = await getChitGroup();
  const members = await getMembers();

  const installmentId = formData.get('installment_id') as string;
  const auctionDate = (formData.get('auction_date') as string) || new Date().toISOString().slice(0, 10);
  const chitValue = parseFloat(formData.get('chit_value') as string);
  const winningBid = parseFloat(formData.get('winning_bid') as string) || 0;
  const winnerMemberId = (formData.get('winner_member_id') as string) || null;
  const notes = (formData.get('notes') as string)?.trim() || '';

  if (!installmentId || isNaN(chitValue) || chitValue <= 0) {
    return { success: false, error: 'Month and Chit Value are required' };
  }

  // Calculate discount & dividend per member accurately
  const discount = winningBid;
  const totalMembers = group.total_members || members.length || 10;
  const dividendPerMember = fromPaise(Math.floor(toPaise(discount) / totalMembers));

  try {
    const auction = await createOrUpdateAuction({
      chit_group_id: group.id,
      installment_id: installmentId,
      auction_date: auctionDate,
      chit_value: chitValue,
      winning_bid: winningBid,
      discount,
      dividend_per_member: dividendPerMember,
      winner_member_id: winnerMemberId,
      notes,
    });

    revalidatePath('/auction');
    revalidatePath('/collection');
    revalidatePath('/members');
    revalidatePath('/');
    return { success: true, data: auction };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to record auction' };
  }
}

export async function deleteAuctionAction(auctionId: string) {
  await requireAdmin();

  try {
    const success = await deleteAuction(auctionId);
    if (!success) return { success: false, error: 'Could not delete auction' };

    revalidatePath('/auction');
    revalidatePath('/collection');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete auction' };
  }
}
