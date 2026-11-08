import PageContainer from '@/components/layout/page-container';
import {
  getCurrentlyBorrowed,
  getOverdueReport,
  getLostOrDamagedEquipment,
  getMostBorrowedItems,
  getLoansByMember,
  getNeverBorrowedItems
} from '@/server/services/report.service';
import { ReportsTabs } from '@/components/reports/reports-tabs';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Reports' };

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = params.tab ?? 'borrowed';
  const from = params.from ? new Date(params.from) : undefined;
  const to = params.to ? new Date(params.to) : undefined;

  // Load data based on active tab
  const [borrowed, overdue, lostDamaged, mostBorrowed, loansByMember, neverBorrowed] =
    await Promise.all([
      getCurrentlyBorrowed(),
      getOverdueReport(),
      getLostOrDamagedEquipment(),
      getMostBorrowedItems({ from, to }),
      getLoansByMember({ from, to, pageSize: 1000 }),
      getNeverBorrowedItems()
    ]);

  return (
    <PageContainer pageTitle='Reports' pageDescription='Equipment lending analytics and exports'>
      <ReportsTabs
        tab={tab}
        borrowed={borrowed as Parameters<typeof ReportsTabs>[0]['borrowed']}
        overdue={overdue as Parameters<typeof ReportsTabs>[0]['overdue']}
        lostDamaged={lostDamaged as Parameters<typeof ReportsTabs>[0]['lostDamaged']}
        mostBorrowed={mostBorrowed as Parameters<typeof ReportsTabs>[0]['mostBorrowed']}
        loansByMember={loansByMember.items as Parameters<typeof ReportsTabs>[0]['loansByMember']}
        neverBorrowed={neverBorrowed as Parameters<typeof ReportsTabs>[0]['neverBorrowed']}
        from={params.from}
        to={params.to}
        counts={{
          borrowed: borrowed.length,
          overdue: overdue.length,
          lostDamaged: lostDamaged.length,
          neverBorrowed: neverBorrowed.length
        }}
      />
    </PageContainer>
  );
}
