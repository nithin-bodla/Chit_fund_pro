import { getAuctions, getMembers, getInstallments, getChitGroup } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { AuctionView } from '@/components/auction/auction-view';

export const dynamic = 'force-dynamic';

export default async function AuctionPage() {
  const [auctions, members, installments, group, session] = await Promise.all([
    getAuctions(),
    getMembers(),
    getInstallments(),
    getChitGroup(),
    getSession(),
  ]);

  return (
    <AuctionView
      auctions={auctions}
      members={members}
      installments={installments}
      group={group}
      isAdmin={session?.role === 'admin'}
    />
  );
}
