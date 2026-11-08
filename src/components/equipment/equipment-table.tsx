'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { Input } from '@/components/ui/input';
import { StatusBadge, ConditionBadge } from '@/components/ui/status-badge';
import { Icons } from '@/components/icons';
import { CopyButton } from '@/components/ui/copy-button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { EquipmentForm } from './equipment-form';
import { BulkAddForm } from './bulk-add-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Category = { id: string; name: string };

type Equipment = {
  id: string;
  assetTag: string;
  name: string;
  category: Category;
  status: string;
  condition: string;
  storageLocation: string;
  serialNumber?: string | null;
  description?: string | null;
  loans?: Array<{
    member?: { fullName: string; studentId: string } | null;
  }>;
};

interface EquipmentTableProps {
  items: Equipment[];
  total: number;
  page: number;
  pageSize: number;
  categories: Category[];
  search?: string;
  statusFilter?: string;
  conditionFilter?: string;
  categoryFilter?: string;
  /** Hide create/edit affordances for read-only roles (EXECUTIVE). */
  isReadOnly?: boolean;
}

export function EquipmentTable({
  items,
  total,
  page,
  pageSize,
  categories,
  search = '',
  statusFilter = '',
  conditionFilter = '',
  categoryFilter = '',
  isReadOnly = false
}: EquipmentTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = React.useState(search);
  const [editItem, setEditItem] = React.useState<Equipment | null>(null);
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showBulkDialog, setShowBulkDialog] = React.useState(false);

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

  const currentBorrower = (item: Equipment) => {
    const activeLoan = item.loans?.[0];
    return activeLoan?.member ?? null;
  };

  return (
    <div className='flex flex-col gap-4'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-2'>
        <form onSubmit={handleSearch} className='flex gap-2'>
          <Input
            placeholder='Search name, asset tag, serial…'
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className='w-64'
          />
          <Button type='submit' variant='outline' size='icon'>
            <Icons.search className='size-4' />
          </Button>
        </form>

        <Select
          value={categoryFilter}
          onValueChange={(v) => updateParam('categoryId', (v ?? '') === 'all' ? '' : (v ?? ''))}
        >
          <SelectTrigger className='w-40'>
            <SelectValue placeholder='All Categories' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => updateParam('status', (v ?? '') === 'all' ? '' : (v ?? ''))}
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='All Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='AVAILABLE'>Available</SelectItem>
            <SelectItem value='BORROWED'>Borrowed</SelectItem>
            <SelectItem value='DAMAGED'>Damaged</SelectItem>
            <SelectItem value='LOST'>Lost</SelectItem>
            <SelectItem value='RETIRED'>Retired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={conditionFilter}
          onValueChange={(v) => updateParam('condition', (v ?? '') === 'all' ? '' : (v ?? ''))}
        >
          <SelectTrigger className='w-36'>
            <SelectValue placeholder='All Condition' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Condition</SelectItem>
            <SelectItem value='GOOD'>Good</SelectItem>
            <SelectItem value='FAIR'>Fair</SelectItem>
            <SelectItem value='DAMAGED'>Damaged</SelectItem>
          </SelectContent>
        </Select>

        {!isReadOnly && (
          <div className='ml-auto flex gap-2'>
            <Button variant='outline' onClick={() => setShowBulkDialog(true)}>
              <Icons.add className='size-4 mr-1' />
              Bulk Add
            </Button>
            <Button onClick={() => setShowAddDialog(true)}>
              <Icons.add className='size-4 mr-1' />
              Add Equipment
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
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
              <TableHead>Current Borrower</TableHead>
              {!isReadOnly && <TableHead className='w-20'>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isReadOnly ? 7 : 8}
                  className='py-10 text-center text-muted-foreground'
                >
                  No equipment found. Add your first item.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const borrower = currentBorrower(item);
                return (
                  <TableRow
                    key={item.id}
                    className='cursor-pointer'
                    onClick={() => router.push(`/dashboard/equipment/${item.id}`)}
                  >
                    <TableCell
                      className='font-mono text-xs'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className='flex items-center gap-1 group/tag'>
                        <span>{item.assetTag}</span>
                        <span className='opacity-0 group-hover/tag:opacity-100 transition-opacity'>
                          <CopyButton value={item.assetTag} size='icon-xs' />
                        </span>
                      </div>
                    </TableCell>
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
                      {borrower ? (
                        <span>
                          {borrower.fullName}
                          <span className='text-xs text-muted-foreground ml-1'>
                            ({borrower.studentId})
                          </span>
                        </span>
                      ) : (
                        <span className='text-muted-foreground'>—</span>
                      )}
                    </TableCell>
                    {!isReadOnly && (
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditItem(item);
                          }}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Icons.edit className='size-4' />
                        </Button>
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

      {/* Add Equipment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>An asset tag will be auto-generated.</DialogDescription>
          </DialogHeader>
          <EquipmentForm
            categories={categories}
            onSuccess={() => setShowAddDialog(false)}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Bulk Add Equipment</DialogTitle>
            <DialogDescription>
              Create multiple identical items with sequential asset tags.
            </DialogDescription>
          </DialogHeader>
          <BulkAddForm
            categories={categories}
            onSuccess={() => setShowBulkDialog(false)}
            onCancel={() => setShowBulkDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Sheet */}
      <Sheet open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <SheetContent className='w-full sm:max-w-md overflow-y-auto'>
          <SheetHeader>
            <SheetTitle>Edit Equipment</SheetTitle>
            <SheetDescription>{editItem?.assetTag}</SheetDescription>
          </SheetHeader>
          <div className='px-4 pb-4'>
            {editItem && (
              <EquipmentForm
                categories={categories}
                defaultValues={{
                  id: editItem.id,
                  name: editItem.name,
                  categoryId: editItem.category.id,
                  description: editItem.description ?? undefined,
                  serialNumber: editItem.serialNumber ?? undefined,
                  condition: editItem.condition,
                  status: editItem.status,
                  storageLocation: editItem.storageLocation,
                  assetTag: editItem.assetTag
                }}
                onSuccess={() => setEditItem(null)}
                onCancel={() => setEditItem(null)}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
