import {
  getMonthCollectionSummaries,
  getMembers,
  getMonthMemberDetails,
} from '@/lib/db';
import { getSession } from '@/lib/auth';
import { CollectionView } from '@/components/collection/collection-view';
import { MemberInstallmentStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function CollectionPage() {
  const [session, months, members] = await Promise.all([
    getSession(),
    getMonthCollectionSummaries(),
    getMembers(),
  ]);

  const isAdmin = session?.role === 'admin';

  // Preload member details for each installment
  const allMonthMembers: Record<string, MemberInstallmentStatus[]> = {};
  for (const m of months) {
    const details = await getMonthMemberDetails(m.installment_id);
    allMonthMembers[m.installment_id] = details.members;
  }

  return (
    <CollectionView
      months={months}
      allMonthMembers={allMonthMembers}
      members={members}
      isAdmin={isAdmin}
    />
  );
}
