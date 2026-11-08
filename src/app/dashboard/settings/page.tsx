import { ChangePasswordForm } from '@/components/settings/change-password-form';
import PageContainer from '@/components/layout/page-container';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <PageContainer pageTitle='Settings' pageDescription='Manage your account settings'>
      <div className='max-w-md'>
        <ChangePasswordForm />
      </div>
    </PageContainer>
  );
}
