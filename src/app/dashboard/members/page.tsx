import PageContainer from '@/components/layout/page-container';
import { getMemberList } from '@/server/services/member.service';
import { MemberTable } from '@/components/members/member-table';
import { auth } from '@/server/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Members' };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = Math.min(50, Math.max(5, parseInt(params.pageSize ?? '20', 10)));
  const search = params.search ?? '';
  const status = params.status ?? '';

  const session = await auth();
  const isReadOnly = session?.user?.role === 'EXECUTIVE';

  const result = await getMemberList({ page, pageSize, search, status });
  const items = result.items as Parameters<typeof MemberTable>[0]['items'];

  return (
    <PageContainer pageTitle='Members' pageDescription='Manage club members and borrowing history'>
      <MemberTable
        items={items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        search={search}
        statusFilter={status}
        isReadOnly={isReadOnly}
      />
    </PageContainer>
  );
}
