'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { LoadingButton } from '@/components/ui/loading-button';
import { bulkCreateEquipmentAction } from '@/app/actions/equipment.actions';
import { cn } from '@/lib/utils';

type Category = { id: string; name: string };

interface BulkAddFormProps {
  categories: Category[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BulkAddForm({ categories, onSuccess, onCancel }: BulkAddFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await bulkCreateEquipmentAction(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const count = result.data.length;
      setSuccessMessage(`Successfully created ${count} item${count !== 1 ? 's' : ''}.`);
      router.refresh();
      setTimeout(() => onSuccess?.(), 1200);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <p className='text-sm text-muted-foreground'>
        Creates multiple identical items with sequential asset tags (e.g. RC-0012, RC-0013…).
      </p>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='bulk-name'>
          Item Name <span className='text-destructive'>*</span>
        </Label>
        <Input id='bulk-name' name='name' placeholder='e.g. Arduino Uno R3' required />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='bulk-category'>
          Category <span className='text-destructive'>*</span>
        </Label>
        <Select name='categoryId' required>
          <SelectTrigger id='bulk-category' className='w-full'>
            <SelectValue placeholder='Select category' />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='bulk-location'>
          Storage Location <span className='text-destructive'>*</span>
        </Label>
        <Input id='bulk-location' name='storageLocation' placeholder='e.g. Shelf A3' required />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='bulk-qty'>
          Quantity <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='bulk-qty'
          name='quantity'
          type='number'
          min={1}
          max={100}
          defaultValue={1}
          required
        />
        <p className='text-xs text-muted-foreground'>Maximum 100 items at once.</p>
      </div>

      {error && (
        <p className={cn('text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2')}>
          {error}
        </p>
      )}
      {successMessage && (
        <p className='text-sm text-green-700 dark:text-green-400 rounded-md bg-green-100 dark:bg-green-900/30 px-3 py-2'>
          {successMessage}
        </p>
      )}

      <div className='flex justify-end gap-2 pt-2'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <LoadingButton type='submit' loading={isPending}>
          Create Items
        </LoadingButton>
      </div>
    </form>
  );
}
