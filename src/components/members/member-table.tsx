'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MemberStatusBadge } from '@/components/ui/status-badge';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { MemberForm } from './member-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Member = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string | null;
  status: string;
  notes: string | null;
  openLoansCount: number;
  overdueCount: number;
};

interface MemberTableProps {
  items: Member[];
  total: number;
  page: number;
  pageSize: number;
  search?: string;
  statusFilter?: string;
  /** Hide create/edit affordances for read-only roles (EXECUTIVE). */
  isReadOnly?: boolean;
}

export function MemberTable({
  items,
  total,
  page,
  pageSize,
  search = '',
  statusFilter = '',
  isReadOnly = false
}: MemberTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = React.useState(search);
  const [editMember, setEditMember] = React.useState<Member | null>(null);
  const [showAddDialog, setShowAddDialog] = React.useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page') params.set('page', '1');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    updateParam('search', searchValue);
  }

  return (
    <div className='flex flex-col gap-4'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-2'>
        <form onSubmit={handleSearch} className='flex gap-2'>
          <Input
            placeholder='Search name, student ID, email…'
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className='w-64'
          />
          <Button type='submit' variant='outline' size='icon'>
            <Icons.search className='size-4' />
          </Button>
        </form>

        <Select
          value={statusFilter}
          onValueChange={(v) => updateParam('status', (v ?? '') === 'all' ? '' : (v ?? ''))}
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='All Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='ACTIVE'>Active</SelectItem>
            <SelectItem value='INACTIVE'>Inactive</SelectItem>
          </SelectContent>
        </Select>

        {!isReadOnly && (
          <div className='ml-auto'>
            <Button onClick={() => setShowAddDialog(true)}>
              <Icons.add className='size-4 mr-1' />
              Add Member
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-center'>Held</TableHead>
              <TableHead className='text-center'>Overdue</TableHead>
              {!isReadOnly && <TableHead className='w-16'>Edit</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isReadOnly ? 8 : 9}
                  className='py-10 text-center text-muted-foreground'
                >
                  No members found. Add the first member.
                </TableCell>
              </TableRow>
            ) : (
              items.map((member) => (
                <TableRow
                  key={member.id}
                  className='cursor-pointer'
                  onClick={() => router.push(`/dashboard/members/${member.id}`)}
                >
                  <TableCell className='font-mono text-xs'>{member.studentId}</TableCell>
                  <TableCell className='font-medium'>{member.fullName}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>{member.email}</TableCell>
                  <TableCell className='text-sm'>{member.phone}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {member.department ?? '—'}
                  </TableCell>
                  <TableCell>
                    <MemberStatusBadge status={member.status as 'ACTIVE' | 'INACTIVE'} />
                  </TableCell>
                  <TableCell className='text-center text-sm'>{member.openLoansCount}</TableCell>
                  <TableCell className='text-center'>
                    {member.overdueCount > 0 ? (
                      <span className='text-sm font-bold text-red-600 dark:text-red-400'>
                        {member.overdueCount}
                      </span>
                    ) : (
                      <span className='text-sm text-muted-foreground'>0</span>
                    )}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='icon-sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditMember(member);
                        }}
                        aria-label={`Edit ${member.fullName}`}
                      >
                        <Icons.edit className='size-4' />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
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
            <span className={cn('inline-flex items-center px-2')}>
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

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Register a new club member.</DialogDescription>
          </DialogHeader>
          <MemberForm
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Sheet */}
      <Sheet open={!!editMember} onOpenChange={(open) => !open && setEditMember(null)}>
        <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>Edit Member</SheetTitle>
            <SheetDescription>{editMember?.studentId}</SheetDescription>
          </SheetHeader>
          <div className='px-4 pb-4'>
            {editMember && (
              <MemberForm
                defaultValues={{
                  id: editMember.id,
                  studentId: editMember.studentId,
                  fullName: editMember.fullName,
                  email: editMember.email,
                  phone: editMember.phone,
                  department: editMember.department ?? undefined,
                  status: editMember.status,
                  notes: editMember.notes ?? undefined
                }}
                onSuccess={() => setEditMember(null)}
                onCancel={() => setEditMember(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
