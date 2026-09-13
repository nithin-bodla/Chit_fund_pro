import { notFound } from 'next/navigation';
import { getMemberDetailsAction } from '@/actions/member-actions';
import { getInstallments } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { MemberDetailView } from '@/components/members/member-detail-view';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [res, installments, session] = await Promise.all([
    getMemberDetailsAction(id),
    getInstallments(),
    getSession(),
  ]);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <MemberDetailView
      member={res.data.member}
      summary={res.data.summary}
      ledger={res.data.ledger}
      payments={res.data.payments}
      installments={installments}
      isAdmin={session?.role === 'admin'}
    />
  );
}
