import PageContainer from '@/components/layout/page-container';
import { getOverdueReport } from '@/server/services/report.service';
import { OverdueTable } from '@/components/overdue/overdue-table';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Overdue Items' };

export default async function OverduePage() {
  const loans = await getOverdueReport();

  return (
    <PageContainer pageTitle='Overdue Items' pageDescription='Items that are past their due date'>
      <OverdueTable loans={loans as Parameters<typeof OverdueTable>[0]['loans']} />
    </PageContainer>
  );
}
