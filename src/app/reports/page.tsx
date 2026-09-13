import { getReportsDataAction } from '@/actions/reports-actions';
import { ReportsView } from '@/components/reports/reports-view';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const data = await getReportsDataAction();
  return <ReportsView initialData={data} />;
}
