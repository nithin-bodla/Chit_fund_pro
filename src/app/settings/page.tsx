import { getChitSettingsAction } from '@/actions/settings-actions';
import { getAdminUsersAction } from '@/actions/auth-actions';
import { getSession } from '@/lib/auth';
import { SettingsView } from '@/components/settings/settings-view';

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    redirect('/admin');
  }

  const [{ group, installments, dbHealth }, usersRes] = await Promise.all([
    getChitSettingsAction(),
    getAdminUsersAction(),
  ]);

  return (
    <SettingsView
      group={group}
      installments={installments}
      dbHealth={dbHealth}
      users={usersRes.data || []}
      currentUsername={session.username}
      currentUserId={session.id}
    />
  );
}
