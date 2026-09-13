'use server';

import {
  getPayments,
  createPayment,
  updatePayment,
  deletePayment,
  getChitGroup,
} from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { PaymentMethod, PaymentStatus } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getPaymentsAction(filters?: {
  member_id?: string;
  installment_id?: string;
  payment_method?: string;
  status?: string;
  search?: string;
}) {
  await requireAdmin();
  return await getPayments(filters);
}

export async function createPaymentAction(formData: FormData) {
  await requireAdmin();

  const group = await getChitGroup();
  const memberId = formData.get('member_id') as string;
  const installmentId = formData.get('installment_id') as string;
  const rawAmount = formData.get('amount') as string;
  const amount = parseFloat(rawAmount);
  const paymentDate = (formData.get('payment_date') as string) || new Date().toISOString().slice(0, 10);
  const paymentMethod = (formData.get('payment_method') as PaymentMethod) || 'Cash';
  const referenceNumber = (formData.get('reference_number') as string)?.trim() || '';
  const status = (formData.get('status') as PaymentStatus) || 'Completed';
  const notes = (formData.get('notes') as string)?.trim() || '';

  if (!memberId || !installmentId || isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Member, Month, and a positive payment amount are required' };
  }

  try {
    const payment = await createPayment({
      member_id: memberId,
      chit_group_id: group.id,
      installment_id: installmentId,
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      status,
      notes,
    });

    revalidatePath('/payments');
    revalidatePath('/collection');
    revalidatePath('/members');
    revalidatePath(`/members/${memberId}`);
    revalidatePath('/');
    return { success: true, data: payment };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to record payment' };
  }
}

export async function updatePaymentAction(paymentId: string, formData: FormData) {
  await requireAdmin();

  const memberId = formData.get('member_id') as string;
  const installmentId = formData.get('installment_id') as string;
  const rawAmount = formData.get('amount') as string;
  const amount = parseFloat(rawAmount);
  const paymentDate = formData.get('payment_date') as string;
  const paymentMethod = formData.get('payment_method') as PaymentMethod;
  const referenceNumber = (formData.get('reference_number') as string)?.trim() || '';
  const status = formData.get('status') as PaymentStatus;
  const notes = (formData.get('notes') as string)?.trim() || '';

  if (isNaN(amount) || amount <= 0) {
    return { success: false, error: 'Valid payment amount is required' };
  }

  try {
    const updated = await updatePayment(paymentId, {
      ...(memberId ? { member_id: memberId } : {}),
      ...(installmentId ? { installment_id: installmentId } : {}),
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      reference_number: referenceNumber,
      status,
      notes,
    });

    revalidatePath('/payments');
    revalidatePath('/collection');
    revalidatePath('/members');
    if (memberId) revalidatePath(`/members/${memberId}`);
    if (updated?.member_id) revalidatePath(`/members/${updated.member_id}`);
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update payment' };
  }
}

export async function deletePaymentAction(paymentId: string) {
  await requireAdmin();

  try {
    const success = await deletePayment(paymentId);
    if (!success) return { success: false, error: 'Could not delete payment' };

    revalidatePath('/payments');
    revalidatePath('/collection');
    revalidatePath('/members');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete payment' };
  }
}
