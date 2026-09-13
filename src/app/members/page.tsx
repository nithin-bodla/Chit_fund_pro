import { getMemberOverviewList } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MembersView } from '@/components/members/members-view';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const [members, session] = await Promise.all([
    getMemberOverviewList(),
    getSession(),
  ]);
  return <MembersView members={members} isAdmin={session?.role === 'admin'} />;
}
