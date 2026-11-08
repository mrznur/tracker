import PageContainer from '@/components/layout/page-container';
import { listUsers } from '@/server/services/user.service';
import { UsersTable } from '@/components/users/users-table';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Users (Admin)' };

export default async function UsersPage() {
  const users = await listUsers();

  return (
    <PageContainer
      pageTitle='Users'
      pageDescription='Admin only: manage system user accounts and roles'
    >
      <UsersTable users={users as Parameters<typeof UsersTable>[0]['users']} />
    </PageContainer>
  );
}
