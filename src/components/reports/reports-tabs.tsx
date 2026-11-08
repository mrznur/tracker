'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DateRangePicker, type DateRange } from '@/components/ui/date-range-picker';
import { StatusBadge, ConditionBadge } from '@/components/ui/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';

// ---- Types ----

type BorrowedLoan = {
  id: string;
  borrowedAt: Date | string;
  dueDate: Date | string;
  isOverdue: boolean;
  equipment: { id: string; assetTag: string; name: string; category: { name: string } };
  member: { id: string; fullName: string; studentId: string; email: string };
  issuedBy: { id: string; name: string };
};

type OverdueLoan = BorrowedLoan & {
  daysLate: number;
  member: BorrowedLoan['member'] & { phone: string };
};

type LostDamagedItem = {
  id: string;
  assetTag: string;
  name: string;
  status: string;
  condition: string;
  storageLocation: string;
  category: { name: string };
  loans: Array<{ member?: { fullName: string; studentId: string } | null }>;
};

type MostBorrowedItem = {
  id: string;
  assetTag: string;
  name: string;
  totalLoans: number;
  category: { name: string };
};

type LoanByMember = {
  id: string;
  borrowedAt: Date | string;
  dueDate: Date | string;
  returnedAt: Date | string | null;
  equipment: { id: string; assetTag: string; name: string };
  member: { id: string; fullName: string; studentId: string };
};

type NeverBorrowedItem = {
  id: string;
  assetTag: string;
  name: string;
  status: string;
  storageLocation: string;
  category: { name: string };
};

interface ReportsTabsProps {
  tab: string;
  borrowed: BorrowedLoan[];
  overdue: OverdueLoan[];
  lostDamaged: LostDamagedItem[];
  mostBorrowed: MostBorrowedItem[];
  loansByMember: LoanByMember[];
  neverBorrowed: NeverBorrowedItem[];
  from?: string;
  to?: string;
  counts: {
    borrowed: number;
    overdue: number;
    lostDamaged: number;
    neverBorrowed: number;
  };
}

// ---- Utilities ----

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const escape = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((row) => row.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---- Component ----

const TABS = [
  { value: 'borrowed', label: 'Currently Borrowed' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'lost-damaged', label: 'Lost / Damaged' },
  { value: 'most-borrowed', label: 'Most Borrowed' },
  { value: 'by-member', label: 'Loans by Member' },
  { value: 'never-borrowed', label: 'Never Borrowed' }
];

export function ReportsTabs({
  tab,
  borrowed,
  overdue,
  lostDamaged,
  mostBorrowed,
  loansByMember,
  neverBorrowed,
  from,
  to,
  counts
}: ReportsTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabLabels: Record<string, string> = {
    borrowed: `Currently Borrowed (${counts.borrowed})`,
    overdue: `Overdue (${counts.overdue})`,
    'lost-damaged': `Lost / Damaged (${counts.lostDamaged})`,
    'most-borrowed': 'Most Borrowed',
    'by-member': 'Loans by Member',
    'never-borrowed': `Never Borrowed (${counts.neverBorrowed})`
  };

  const TABS_WITH_COUNTS = TABS.map((t) => ({ ...t, label: tabLabels[t.value] ?? t.label }));

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.push(`${pathname}?${params.toString()}`);
  }

  function setDateRange(range: DateRange) {
    const params = new URLSearchParams(searchParams.toString());
    if (range.from) params.set('from', range.from);
    else params.delete('from');
    if (range.to) params.set('to', range.to);
    else params.delete('to');
    router.push(`${pathname}?${params.toString()}`);
  }

  // Export handlers
  function exportBorrowed() {
    downloadCSV(
      `borrowed-report-${todayStr()}.csv`,
      borrowed.map((l) => [
        l.member.studentId,
        l.member.fullName,
        l.equipment.assetTag,
        l.equipment.name,
        l.equipment.category.name,
        formatDate(l.borrowedAt),
        formatDate(l.dueDate),
        l.isOverdue ? 'Yes' : 'No',
        l.issuedBy.name
      ]),
      [
        'Student ID',
        'Member',
        'Asset Tag',
        'Item',
        'Category',
        'Borrowed',
        'Due',
        'Overdue',
        'Issued By'
      ]
    );
  }

  function exportOverdue() {
    downloadCSV(
      `overdue-report-${todayStr()}.csv`,
      overdue.map((l) => [
        l.member.studentId,
        l.member.fullName,
        l.member.phone,
        l.member.email,
        l.equipment.assetTag,
        l.equipment.name,
        formatDate(l.borrowedAt),
        formatDate(l.dueDate),
        String(l.daysLate)
      ]),
      [
        'Student ID',
        'Member',
        'Phone',
        'Email',
        'Asset Tag',
        'Item',
        'Borrowed',
        'Due',
        'Days Late'
      ]
    );
  }

  function exportLostDamaged() {
    downloadCSV(
      `lost-damaged-report-${todayStr()}.csv`,
      lostDamaged.map((e) => [
        e.assetTag,
        e.name,
        e.category.name,
        e.status,
        e.condition,
        e.storageLocation,
        e.loans[0]?.member?.fullName ?? '—',
        e.loans[0]?.member?.studentId ?? '—'
      ]),
      [
        'Asset Tag',
        'Name',
        'Category',
        'Status',
        'Condition',
        'Location',
        'Last Borrower',
        'Student ID'
      ]
    );
  }

  function exportMostBorrowed() {
    downloadCSV(
      `most-borrowed-report-${todayStr()}.csv`,
      mostBorrowed.map((e) => [e.assetTag, e.name, e.category.name, String(e.totalLoans)]),
      ['Asset Tag', 'Name', 'Category', 'Total Loans']
    );
  }

  function exportLoansByMember() {
    downloadCSV(
      `loans-by-member-report-${todayStr()}.csv`,
      loansByMember.map((l) => [
        l.member.studentId,
        l.member.fullName,
        l.equipment.assetTag,
        l.equipment.name,
        formatDate(l.borrowedAt),
        formatDate(l.dueDate),
        l.returnedAt ? formatDate(l.returnedAt) : 'Active'
      ]),
      ['Student ID', 'Member', 'Asset Tag', 'Item', 'Borrowed', 'Due', 'Returned']
    );
  }

  function exportNeverBorrowed() {
    downloadCSV(
      `never-borrowed-report-${todayStr()}.csv`,
      neverBorrowed.map((e) => [e.assetTag, e.name, e.category.name, e.status, e.storageLocation]),
      ['Asset Tag', 'Name', 'Category', 'Status', 'Location']
    );
  }

  const needsDateRange = tab === 'most-borrowed' || tab === 'by-member';

  return (
    <div className='flex flex-col gap-4'>
      <Tabs value={tab} onValueChange={setTab}>
        <div className='flex flex-wrap items-center gap-3'>
          <TabsList className='h-auto flex-wrap'>
            {TABS_WITH_COUNTS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {needsDateRange && (
          <div className='mt-2'>
            <DateRangePicker value={{ from, to }} onChange={setDateRange} />
          </div>
        )}

        {/* Currently Borrowed */}
        <TabsContent value='borrowed' className='mt-4'>
          <div className='flex justify-end mb-2'>
            <Button variant='outline' size='sm' onClick={exportBorrowed}>
              <Icons.fileTypeXls className='size-4 mr-1' />
              Export CSV
            </Button>
          </div>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Issued By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {borrowed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='py-8 text-center text-muted-foreground'>
                      No items currently borrowed.
                    </TableCell>
                  </TableRow>
                ) : (
                  borrowed.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className='font-mono text-xs'>{loan.member.studentId}</TableCell>
                      <TableCell className='font-medium'>{loan.member.fullName}</TableCell>
                      <TableCell className='font-mono text-xs'>{loan.equipment.assetTag}</TableCell>
                      <TableCell>{loan.equipment.name}</TableCell>
                      <TableCell className='text-muted-foreground text-sm'>
                        {loan.equipment.category.name}
                      </TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.borrowedAt)}</TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
                      <TableCell className='text-sm'>{loan.issuedBy.name}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Overdue */}
        <TabsContent value='overdue' className='mt-4'>
          <div className='flex justify-end mb-2'>
            <Button variant='outline' size='sm' onClick={exportOverdue}>
              <Icons.fileTypeXls className='size-4 mr-1' />
              Export CSV
            </Button>
          </div>
          <div className='rounded-lg border print:block'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead className='text-right'>Days Late</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='py-8 text-center text-muted-foreground'>
                      No overdue items. Great job! 🎉
                    </TableCell>
                  </TableRow>
                ) : (
                  overdue.map((loan) => (
                    <TableRow key={loan.id} className='bg-red-50/40 dark:bg-red-950/10'>
                      <TableCell>
                        <div className='font-medium'>{loan.member.fullName}</div>
                        <div className='text-xs text-muted-foreground'>{loan.member.studentId}</div>
                      </TableCell>
                      <TableCell className='text-sm'>{loan.member.phone}</TableCell>
                      <TableCell>{loan.equipment.name}</TableCell>
                      <TableCell className='font-mono text-xs'>{loan.equipment.assetTag}</TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
                      <TableCell className='text-right'>
                        <span className='font-bold text-red-600 dark:text-red-400'>
                          {loan.daysLate}d
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Lost or Damaged */}
        <TabsContent value='lost-damaged' className='mt-4'>
          <div className='flex justify-end mb-2'>
            <Button variant='outline' size='sm' onClick={exportLostDamaged}>
              <Icons.fileTypeXls className='size-4 mr-1' />
              Export CSV
            </Button>
          </div>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Borrower</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lostDamaged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='py-8 text-center text-muted-foreground'>
                      No lost or damaged items.
                    </TableCell>
                  </TableRow>
                ) : (
                  lostDamaged.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-mono text-xs'>{item.assetTag}</TableCell>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {item.category.name}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            item.status as 'AVAILABLE' | 'BORROWED' | 'DAMAGED' | 'LOST' | 'RETIRED'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <ConditionBadge condition={item.condition as 'GOOD' | 'FAIR' | 'DAMAGED'} />
                      </TableCell>
                      <TableCell className='text-sm'>{item.storageLocation}</TableCell>
                      <TableCell className='text-sm'>
                        {item.loans[0]?.member ? (
                          <span>
                            {item.loans[0].member.fullName}
                            <span className='text-xs text-muted-foreground ml-1'>
                              ({item.loans[0].member.studentId})
                            </span>
                          </span>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Most Borrowed */}
        <TabsContent value='most-borrowed' className='mt-4'>
          <div className='flex justify-end mb-2'>
            <Button variant='outline' size='sm' onClick={exportMostBorrowed}>
              <Icons.fileTypeXls className='size-4 mr-1' />
              Export CSV
            </Button>
          </div>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>#</TableHead>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className='text-right'>Total Loans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mostBorrowed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                      No loan data for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  mostBorrowed.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell className='text-muted-foreground'>{idx + 1}</TableCell>
                      <TableCell className='font-mono text-xs'>{item.assetTag}</TableCell>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {item.category.name}
                      </TableCell>
                      <TableCell className='text-right font-bold'>{item.totalLoans}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Loans by Member */}
        <TabsContent value='by-member' className='mt-4'>
          <div className='flex justify-end mb-2'>
            <Button variant='outline' size='sm' onClick={exportLoansByMember}>
              <Icons.fileTypeXls className='size-4 mr-1' />
              Export CSV
            </Button>
          </div>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Borrowed</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Returned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loansByMember.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className='py-8 text-center text-muted-foreground'>
                      No loans for the selected period.
                    </TableCell>
                  </TableRow>
                ) : (
                  loansByMember.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className='font-mono text-xs'>{loan.member.studentId}</TableCell>
                      <TableCell className='font-medium'>{loan.member.fullName}</TableCell>
                      <TableCell className='font-mono text-xs'>{loan.equipment.assetTag}</TableCell>
                      <TableCell>{loan.equipment.name}</TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.borrowedAt)}</TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
                      <TableCell className='text-sm'>
                        {loan.returnedAt ? (
                          formatDate(loan.returnedAt)
                        ) : (
                          <span className='text-amber-600 text-xs font-medium'>Active</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Never Borrowed */}
        <TabsContent value='never-borrowed' className='mt-4'>
          <div className='flex justify-end mb-2'>
            <Button variant='outline' size='sm' onClick={exportNeverBorrowed}>
              <Icons.fileTypeXls className='size-4 mr-1' />
              Export CSV
            </Button>
          </div>
          <div className='rounded-lg border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Tag</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {neverBorrowed.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='py-8 text-center text-muted-foreground'>
                      All items have been borrowed at least once.
                    </TableCell>
                  </TableRow>
                ) : (
                  neverBorrowed.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className='font-mono text-xs'>{item.assetTag}</TableCell>
                      <TableCell className='font-medium'>{item.name}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {item.category.name}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={
                            item.status as 'AVAILABLE' | 'BORROWED' | 'DAMAGED' | 'LOST' | 'RETIRED'
                          }
                        />
                      </TableCell>
                      <TableCell className='text-sm'>{item.storageLocation}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
