import { getPayments, getMembers, getInstallments } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { PaymentsView } from '@/components/payments/payments-view';

export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  const [payments, members, installments, session] = await Promise.all([
    getPayments(),
    getMembers(),
    getInstallments(),
    getSession(),
  ]);

  return (
    <PaymentsView
      initialPayments={payments}
      members={members}
      installments={installments}
      isAdmin={session?.role === 'admin'}
    />
  );
}
