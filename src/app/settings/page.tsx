import { getSession } from '@/lib/auth';
import { getChitGroup, getInstallments, getDbHealth, getAllUsers } from '@/lib/db';
import { SettingsView } from '@/components/settings/settings-view';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/admin');
  }

  let group, installments, dbHealth, users;
  try {
    [group, installments, dbHealth, users] = await Promise.all([
      getChitGroup(),
      getInstallments(),
      getDbHealth(),
      getAllUsers(),
    ]);
  } catch (err) {
    console.error('Failed to load settings data:', err);
  }

  return (
    <SettingsView
      group={group!}
      installments={installments || []}
      dbHealth={
        dbHealth || {
          connected: false,
          isNeon: false,
          latencyMs: 0,
          tableCounts: { chit_groups: 1, members: 0, payments: 0, auctions: 0 },
        }
      }
      users={users || []}
      currentUsername={session.username}
      currentUserId={session.id}
    />
  );
}
