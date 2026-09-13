import { getSession } from '@/lib/auth';
import { getChitGroup, getDashboardMetrics, getInstallments, getMembers } from '@/lib/db';
import { AdminLoginView } from '@/components/admin/admin-login-view';
import { AdminHubView } from '@/components/admin/admin-hub-view';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getSession();

  // If unauthenticated, render the dedicated Admin Login portal
  if (!session || session.role !== 'admin') {
    return <AdminLoginView />;
  }

  // If authenticated as Admin, load summary data and render the Admin Control Center
  const [group, metrics, installments, members] = await Promise.all([
    getChitGroup(),
    getDashboardMetrics(),
    getInstallments(),
    getMembers(),
  ]);

  return (
    <AdminHubView
      username={session.username}
      group={group}
      metrics={metrics}
      installments={installments}
      members={members}
    />
  );
}
