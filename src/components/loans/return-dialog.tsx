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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { LoadingButton } from '@/components/ui/loading-button';
import { returnLoanAction } from '@/app/actions/loan.actions';

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  memberName: string;
  equipmentName: string;
  assetTag: string;
}

export function ReturnDialog({
  open,
  onOpenChange,
  loanId,
  memberName,
  equipmentName,
  assetTag
}: ReturnDialogProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [condition, setCondition] = React.useState('GOOD');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    formData.set('loanId', loanId);
    formData.set('returnCondition', condition);
    try {
      const result = await returnLoanAction(formData);
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
          <DialogTitle>Return Item</DialogTitle>
          <DialogDescription>
            Returning <strong>{equipmentName}</strong> ({assetTag}) from{' '}
            <strong>{memberName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          <input type='hidden' name='loanId' value={loanId} />

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='ret-condition'>
              Return Condition <span className='text-destructive'>*</span>
            </Label>
            <Select
              name='returnCondition'
              value={condition}
              onValueChange={(v) => v && setCondition(v)}
              required
            >
              <SelectTrigger id='ret-condition' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='GOOD'>Good</SelectItem>
                <SelectItem value='FAIR'>Fair</SelectItem>
                <SelectItem value='DAMAGED'>Damaged</SelectItem>
                <SelectItem value='LOST'>Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='ret-notes'>Notes</Label>
            <Input id='ret-notes' name='notes' placeholder='Optional notes about the return' />
          </div>

          {error && (
            <p className='text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2'>
              {error}
            </p>
          )}

          <DialogFooter showCloseButton>
            <LoadingButton type='submit' loading={isPending}>
              Confirm Return
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
