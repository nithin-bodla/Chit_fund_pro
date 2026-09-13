import { getChitSettingsAction } from '@/actions/settings-actions';
import { getAdminUsersAction } from '@/actions/auth-actions';
import { getSession } from '@/lib/auth';
import { SettingsView } from '@/components/settings/settings-view';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [{ group, installments, dbHealth }, usersRes, session] = await Promise.all([
    getChitSettingsAction(),
    getAdminUsersAction(),
    getSession(),
  ]);

  return (
    <SettingsView
      group={group}
      installments={installments}
      dbHealth={dbHealth}
      users={usersRes.data || []}
      currentUsername={session?.username || 'admin'}
      currentUserId={session?.id}
    />
  );
}
