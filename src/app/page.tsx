import { getDashboardMetrics, getInstallments, getMembers } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DashboardView } from '@/components/dashboard/dashboard-view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [metrics, installments, members, session] = await Promise.all([
    getDashboardMetrics(),
    getInstallments(),
    getMembers(),
    getSession(),
  ]);

  return (
    <DashboardView
      metrics={metrics}
      installments={installments}
      members={members}
      isAdmin={session?.role === 'admin'}
    />
  );
}
