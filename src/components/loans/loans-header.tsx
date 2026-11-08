'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Icons } from '@/components/icons';
import { NewLoanDialog } from './new-loan-dialog';

interface LoansHeaderProps {
  tab: string;
  members: { id: string; studentId: string; fullName: string; status: string }[];
  equipment: { id: string; assetTag: string; name: string; status: string }[];
  /** Hide the New Loan affordance for read-only roles (EXECUTIVE). */
  isReadOnly?: boolean;
}

const TABS = [
  { value: 'active', label: 'Active' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'returned', label: 'Returned' },
  { value: 'all', label: 'All' }
];

export function LoansHeader({ tab, members, equipment, isReadOnly = false }: LoansHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showNewLoan, setShowNewLoan] = React.useState(false);

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className='flex flex-wrap items-center justify-between gap-3'>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {!isReadOnly && (
        <Button onClick={() => setShowNewLoan(true)}>
          <Icons.add className='size-4 mr-1' />
          New Loan
        </Button>
      )}

      <NewLoanDialog
        open={showNewLoan}
        onOpenChange={setShowNewLoan}
        members={members}
        equipment={equipment}
      />
    </div>
  );
}
