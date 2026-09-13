'use server';

import {
  getChitGroup,
  updateChitGroup,
  getInstallments,
  updateInstallment,
  createInstallment,
  deleteInstallment,
  getDbHealth,
  seedNeonDatabase,
} from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getChitSettingsAction() {
  await requireAdmin();
  const [group, installments, dbHealth] = await Promise.all([
    getChitGroup(),
    getInstallments(),
    getDbHealth(),
  ]);
  return { group, installments, dbHealth };
}

export async function updateChitSettingsAction(formData: FormData) {
  await requireAdmin();

  const name = (formData.get('name') as string)?.trim();
  const totalMembers = parseInt(formData.get('total_members') as string, 10);
  const monthlyBaseAmount = parseFloat(formData.get('monthly_base_amount') as string);
  const regularAmount = parseFloat(formData.get('regular_member_monthly_amount') as string);
  const afterLiftAmount = parseFloat(formData.get('after_lift_monthly_amount') as string);
  const startDate = formData.get('start_date') as string;
  const endDate = formData.get('end_date') as string;

  if (!name || isNaN(totalMembers) || isNaN(monthlyBaseAmount)) {
    return { success: false, error: 'Chit name, total members, and base amount are required' };
  }

  try {
    const updated = await updateChitGroup({
      name,
      total_members: totalMembers,
      monthly_base_amount: monthlyBaseAmount,
      regular_member_monthly_amount: isNaN(regularAmount) ? 5000 : regularAmount,
      after_lift_monthly_amount: isNaN(afterLiftAmount) ? 6000 : afterLiftAmount,
      start_date: startDate,
      end_date: endDate,
    });

    revalidatePath('/settings');
    revalidatePath('/members');
    revalidatePath('/collection');
    revalidatePath('/payments');
    revalidatePath('/auction');
    revalidatePath('/reports');
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update settings' };
  }
}

export async function updateInstallmentAction(installmentId: string, formData: FormData) {
  await requireAdmin();

  const expectedAmount = parseFloat(formData.get('expected_amount') as string);
  const dueDate = formData.get('due_date') as string;
  const monthName = (formData.get('month_name') as string)?.trim();
  const notes = (formData.get('notes') as string)?.trim() || '';

  if (isNaN(expectedAmount) || expectedAmount <= 0) {
    return { success: false, error: 'Valid expected amount is required' };
  }

  try {
    const updated = await updateInstallment(installmentId, {
      expected_amount: expectedAmount,
      due_date: dueDate,
      month_name: monthName,
      notes,
    });

    revalidatePath('/settings');
    revalidatePath('/collection');
    revalidatePath('/members');
    revalidatePath('/payments');
    revalidatePath('/auction');
    revalidatePath('/reports');
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to update installment' };
  }
}

export async function createInstallmentAction(formData: FormData) {
  await requireAdmin();

  const group = await getChitGroup();
  const monthNumber = parseInt(formData.get('month_number') as string, 10);
  const monthName = (formData.get('month_name') as string)?.trim();
  const dueDate = formData.get('due_date') as string;
  const expectedAmount = parseFloat(formData.get('expected_amount') as string);
  const notes = (formData.get('notes') as string)?.trim() || '';

  if (!monthName || isNaN(monthNumber) || isNaN(expectedAmount) || expectedAmount <= 0) {
    return { success: false, error: 'Month number, name, and positive expected amount are required' };
  }

  try {
    const created = await createInstallment({
      chit_group_id: group.id,
      month_number: monthNumber,
      month_name: monthName,
      due_date: dueDate || new Date().toISOString().slice(0, 10),
      expected_amount: expectedAmount,
      notes,
    });

    revalidatePath('/settings');
    revalidatePath('/collection');
    revalidatePath('/members');
    revalidatePath('/payments');
    revalidatePath('/auction');
    revalidatePath('/reports');
    revalidatePath('/');
    return { success: true, data: created };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to add installment month' };
  }
}

export async function deleteInstallmentAction(installmentId: string) {
  await requireAdmin();

  try {
    const success = await deleteInstallment(installmentId);
    if (!success) return { success: false, error: 'Could not delete installment' };

    revalidatePath('/settings');
    revalidatePath('/collection');
    revalidatePath('/members');
    revalidatePath('/payments');
    revalidatePath('/auction');
    revalidatePath('/reports');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to delete installment' };
  }
}

export async function getDbHealthAction() {
  await requireAdmin();
  return await getDbHealth();
}

export async function reseedDatabaseAction() {
  await requireAdmin();
  try {
    await seedNeonDatabase();
    revalidatePath('/');
    revalidatePath('/members');
    revalidatePath('/collection');
    revalidatePath('/payments');
    revalidatePath('/auction');
    revalidatePath('/reports');
    revalidatePath('/settings');
    return { success: true, message: 'Database reset and re-seeded with initial chit fund data' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to re-seed database' };
  }
}
