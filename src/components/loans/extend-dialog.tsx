'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { extendLoanAction } from '@/app/actions/loan.actions';

interface ExtendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  memberName: string;
  equipmentName: string;
  currentDueDate: string;
}

export function ExtendDialog({
  open,
  onOpenChange,
  loanId,
  memberName,
  equipmentName,
  currentDueDate
}: ExtendDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set('loanId', loanId);
    try {
      const result = await extendLoanAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      onOpenChange(false);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Extend Loan</DialogTitle>
          <DialogDescription>
            Extend loan for <strong>{equipmentName}</strong> ({memberName}). Current due date:{' '}
            {currentDueDate}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <input type='hidden' name='loanId' value={loanId} />

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='ext-date'>
              New Due Date <span className='text-destructive'>*</span>
            </Label>
            <Input id='ext-date' name='newDueDate' type='date' min={currentDueDate} required />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='ext-reason'>
              Reason <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='ext-reason'
              name='reason'
              placeholder='e.g. Competition extended to next week'
              required
            />
          </div>

          {error && (
            <p className='text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2'>
              {error}
            </p>
          )}

          <DialogFooter showCloseButton>
            <LoadingButton type='submit' loading={isPending}>
              Extend Due Date
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
