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
import { createEquipmentAction, updateEquipmentAction } from '@/app/actions/equipment.actions';
import { cn } from '@/lib/utils';

type Category = { id: string; name: string };

type EquipmentFormData = {
  id?: string;
  name?: string;
  categoryId?: string;
  description?: string;
  serialNumber?: string;
  condition?: string;
  status?: string;
  storageLocation?: string;
  assetTag?: string;
};

interface EquipmentFormProps {
  categories: Category[];
  defaultValues?: EquipmentFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EquipmentForm({
  categories,
  defaultValues,
  onSuccess,
  onCancel
}: EquipmentFormProps) {
  const router = useRouter();
  const isEditing = !!defaultValues?.id;
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = isEditing
        ? await updateEquipmentAction(defaultValues!.id!, formData)
        : await createEquipmentAction(formData);

      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
      onSuccess?.();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      {isEditing && defaultValues?.assetTag && (
        <div className='flex flex-col gap-1.5'>
          <Label>Asset Tag</Label>
          <Input value={defaultValues.assetTag} readOnly className='bg-muted font-mono' />
        </div>
      )}

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='eq-name'>
          Name <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='eq-name'
          name='name'
          defaultValue={defaultValues?.name}
          placeholder='e.g. Arduino Uno R3'
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='eq-category'>
          Category <span className='text-destructive'>*</span>
        </Label>
        <Select name='categoryId' defaultValue={defaultValues?.categoryId} required>
          <SelectTrigger id='eq-category' className='w-full'>
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
        <Label htmlFor='eq-location'>
          Storage Location <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='eq-location'
          name='storageLocation'
          defaultValue={defaultValues?.storageLocation}
          placeholder='e.g. Shelf A3'
          required
        />
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='eq-condition'>Condition</Label>
          <Select name='condition' defaultValue={defaultValues?.condition ?? 'GOOD'}>
            <SelectTrigger id='eq-condition' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='GOOD'>Good</SelectItem>
              <SelectItem value='FAIR'>Fair</SelectItem>
              <SelectItem value='DAMAGED'>Damaged</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isEditing && (
          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='eq-status'>Status</Label>
            <Select name='status' defaultValue={defaultValues?.status ?? 'AVAILABLE'}>
              <SelectTrigger id='eq-status' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='AVAILABLE'>Available</SelectItem>
                <SelectItem value='DAMAGED'>Damaged</SelectItem>
                <SelectItem value='LOST'>Lost</SelectItem>
                <SelectItem value='RETIRED'>Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='eq-serial'>Serial Number</Label>
        <Input
          id='eq-serial'
          name='serialNumber'
          defaultValue={defaultValues?.serialNumber}
          placeholder='Optional'
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='eq-desc'>Description</Label>
        <Input
          id='eq-desc'
          name='description'
          defaultValue={defaultValues?.description}
          placeholder='Optional notes about this item'
        />
      </div>

      {isEditing && (
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='eq-notes'>Repair Note</Label>
          <Input
            id='eq-notes'
            name='notes'
            placeholder='If restoring from damaged, describe the repair'
          />
        </div>
      )}

      {error && (
        <p className={cn('text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2')}>
          {error}
        </p>
      )}

      <div className='flex justify-end gap-2 pt-2'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <LoadingButton type='submit' loading={isPending}>
          {isEditing ? 'Save Changes' : 'Add Equipment'}
        </LoadingButton>
      </div>
    </form>
  );
}
