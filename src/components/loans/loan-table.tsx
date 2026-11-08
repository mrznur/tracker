'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { LoanStatusBadge } from '@/components/ui/status-badge';
import { ReturnDialog } from './return-dialog';
import { ExtendDialog } from './extend-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertModal } from '@/components/modal/alert-modal';
import { markLostAction } from '@/app/actions/loan.actions';
import { cn } from '@/lib/utils';

type Loan = {
  id: string;
  borrowedAt: Date | string;
  dueDate: Date | string;
  returnedAt: Date | string | null;
  purpose: string;
  member: { id: string; fullName: string; studentId: string };
  equipment: { id: string; assetTag: string; name: string };
};

interface LoanTableProps {
  loans: Loan[];
  total: number;
  page: number;
  pageSize: number;
  tab: string;
  today: string;
  /** Hide return/extend/mark-lost affordances for read-only roles (EXECUTIVE). */
  isReadOnly?: boolean;
}

function formatDate(date: Date | string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: process.env.NEXT_PUBLIC_APP_TIMEZONE ?? 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function isOverdue(dueDate: Date | string, returnedAt: Date | string | null): boolean {
  if (returnedAt) return false;
  return new Date(dueDate) < new Date();
}

function daysInfo(dueDate: Date | string, returnedAt: Date | string | null): string {
  if (returnedAt) return 'Returned';
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  return `${diff}d left`;
}

const EMPTY_MESSAGES: Record<string, string> = {
  active: 'No active loans.',
  overdue: 'No overdue items. Great job! 🎉',
  returned: 'No returned loans yet.',
  all: 'No loans found.'
};

export function LoanTable({
  loans,
  total,
  page,
  pageSize,
  tab,
  today,
  isReadOnly = false
}: LoanTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [returnLoan, setReturnLoan] = React.useState<Loan | null>(null);
  const [extendLoan, setExtendLoan] = React.useState<Loan | null>(null);
  const [markLostLoan, setMarkLostLoan] = React.useState<Loan | null>(null);
  const [markingLost, setMarkingLost] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }

  async function handleMarkLost() {
    if (!markLostLoan) return;
    setMarkingLost(true);
    const fd = new FormData();
    fd.set('loanId', markLostLoan.id);
    await markLostAction(fd);
    setMarkingLost(false);
    setMarkLostLoan(null);
    router.refresh();
  }

  const isActiveTab = tab === 'active' || tab === 'overdue';

  return (
    <div className='flex flex-col gap-4'>
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Asset Tag</TableHead>
              <TableHead>Borrowed</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              {isActiveTab && !isReadOnly && <TableHead className='w-16'>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isActiveTab && !isReadOnly ? 8 : 7}
                  className='py-10 text-center text-muted-foreground'
                >
                  {EMPTY_MESSAGES[tab] ?? 'No loans found.'}
                </TableCell>
              </TableRow>
            ) : (
              loans.map((loan) => {
                const overdue = isOverdue(loan.dueDate, loan.returnedAt);
                const info = daysInfo(loan.dueDate, loan.returnedAt);
                const loanStatus = loan.returnedAt ? 'RETURNED' : overdue ? 'OVERDUE' : 'ACTIVE';

                return (
                  <TableRow
                    key={loan.id}
                    className={cn(overdue && !loan.returnedAt && 'bg-red-50/50 dark:bg-red-950/10')}
                  >
                    <TableCell className='font-medium'>{loan.member.fullName}</TableCell>
                    <TableCell className='text-sm text-muted-foreground font-mono'>
                      {loan.member.studentId}
                    </TableCell>
                    <TableCell className='text-sm'>{loan.equipment.name}</TableCell>
                    <TableCell className='text-xs font-mono'>{loan.equipment.assetTag}</TableCell>
                    <TableCell className='text-sm'>{formatDate(loan.borrowedAt)}</TableCell>
                    <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
                    <TableCell>
                      <div className='flex flex-col gap-1'>
                        <LoanStatusBadge status={loanStatus} />
                        <span
                          className={cn(
                            'text-xs',
                            overdue && !loan.returnedAt
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : 'text-muted-foreground'
                          )}
                        >
                          {info}
                        </span>
                      </div>
                    </TableCell>
                    {isActiveTab && !isReadOnly && (
                      <TableCell>
                        {!loan.returnedAt && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant='ghost' size='icon-sm' aria-label='Loan actions' />
                              }
                            >
                              <Icons.ellipsis className='size-4' />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => setReturnLoan(loan)}>
                                <Icons.check className='size-4 mr-2' />
                                Return
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setExtendLoan(loan)}>
                                <Icons.calendar className='size-4 mr-2' />
                                Extend
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setMarkLostLoan(loan)}
                                className='text-destructive focus:text-destructive'
                              >
                                <Icons.alertCircle className='size-4 mr-2' />
                                Mark Lost
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className='flex gap-1'>
            <Button
              variant='outline'
              size='icon-sm'
              disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1))}
              aria-label='Previous page'
            >
              <Icons.chevronLeft className='size-4' />
            </Button>
            <span className='inline-flex items-center px-2'>
              {page} / {totalPages}
            </span>
            <Button
              variant='outline'
              size='icon-sm'
              disabled={page >= totalPages}
              onClick={() => updateParam('page', String(page + 1))}
              aria-label='Next page'
            >
              <Icons.chevronRight className='size-4' />
            </Button>
          </div>
        </div>
      )}

      {/* Return Dialog */}
      {returnLoan && (
        <ReturnDialog
          open={!!returnLoan}
          onOpenChange={(o) => !o && setReturnLoan(null)}
          loanId={returnLoan.id}
          memberName={returnLoan.member.fullName}
          equipmentName={returnLoan.equipment.name}
          assetTag={returnLoan.equipment.assetTag}
        />
      )}

      {/* Extend Dialog */}
      {extendLoan && (
        <ExtendDialog
          open={!!extendLoan}
          onOpenChange={(o) => !o && setExtendLoan(null)}
          loanId={extendLoan.id}
          memberName={extendLoan.member.fullName}
          equipmentName={extendLoan.equipment.name}
          currentDueDate={new Date(extendLoan.dueDate).toISOString().slice(0, 10)}
        />
      )}

      {/* Mark Lost Confirm */}
      <AlertModal
        isOpen={!!markLostLoan}
        onClose={() => setMarkLostLoan(null)}
        onConfirm={handleMarkLost}
        loading={markingLost}
        title='Mark as Lost?'
        description={
          markLostLoan
            ? `Are you sure? This will mark ${markLostLoan.equipment.name} (${markLostLoan.equipment.assetTag}) as lost and close the loan.`
            : 'Are you sure?'
        }
        confirmLabel='Mark Lost'
      />
    </div>
  );
}
