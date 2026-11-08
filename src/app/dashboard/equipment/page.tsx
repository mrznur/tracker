import PageContainer from '@/components/layout/page-container';
import { getEquipmentList } from '@/server/services/equipment.service';
import { listCategories } from '@/server/services/category.service';
import { EquipmentTable } from '@/components/equipment/equipment-table';
import { auth } from '@/server/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Equipment' };

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    categoryId?: string;
    status?: string;
    condition?: string;
  }>;
}

export default async function EquipmentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? '1', 10));
  const pageSize = Math.min(50, Math.max(5, parseInt(params.pageSize ?? '20', 10)));
  const search = params.search ?? '';
  const categoryId = params.categoryId ?? '';
  const status = params.status ?? '';
  const condition = params.condition ?? '';

  const session = await auth();
  const isReadOnly = session?.user?.role === 'EXECUTIVE';

  const [result, categories] = await Promise.all([
    getEquipmentList({ page, pageSize, search, categoryId, status, condition }),
    listCategories()
  ]);

  const items = result.items as Parameters<typeof EquipmentTable>[0]['items'];
  const cats = categories as { id: string; name: string }[];

  return (
    <PageContainer pageTitle='Equipment' pageDescription='Manage all club equipment and inventory'>
      <EquipmentTable
        items={items}
        total={result.total}
        page={result.page}
        pageSize={result.pageSize}
        categories={cats}
        search={search}
        statusFilter={status}
        conditionFilter={condition}
        categoryFilter={categoryId}
        isReadOnly={isReadOnly}
      />
    </PageContainer>
  );
}
