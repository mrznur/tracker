import PageContainer from '@/components/layout/page-container';
import { getLoanList } from '@/server/services/loan.service';
import { getMemberList } from '@/server/services/member.service';
import { getEquipmentList } from '@/server/services/equipment.service';
import { LoanTable } from '@/components/loans/loan-table';
import { LoansHeader } from '@/components/loans/loans-header';
import { auth } from '@/server/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Loans' };

type Tab = 'active' | 'overdue' | 'returned' | 'all';

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    tab?: string;
  }>;
}

export default async function LoansPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = (
    ['active', 'overdue', 'returned', 'all'].includes(params.tab ?? '') ? params.tab : 'active'
  ) as Tab;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = Math.min(50, Math.max(5, parseInt(params.pageSize ?? '20', 10)));

  const [loansResult, membersResult, equipResult] = await Promise.all([
    getLoanList({ page, pageSize, tab }),
    getMemberList({ pageSize: 1000 }),
    getEquipmentList({ pageSize: 1000, status: 'AVAILABLE' })
  ]);

  const session = await auth();
  const isReadOnly = session?.user?.role === 'EXECUTIVE';

  const loans = loansResult.items as Parameters<typeof LoanTable>[0]['loans'];
  const members = membersResult.items as {
    id: string;
    studentId: string;
    fullName: string;
    status: string;
  }[];
  const equipment = equipResult.items as {
    id: string;
    assetTag: string;
    name: string;
    status: string;
  }[];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageContainer pageTitle='Loans' pageDescription='Track all equipment loans'>
      <div className='flex flex-col gap-4'>
        <LoansHeader tab={tab} members={members} equipment={equipment} isReadOnly={isReadOnly} />
        <LoanTable
          loans={loans}
          total={loansResult.total}
          page={loansResult.page}
          pageSize={loansResult.pageSize}
          tab={tab}
          today={today}
          isReadOnly={isReadOnly}
        />
      </div>
    </PageContainer>
  );
}
