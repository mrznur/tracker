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
import { createMemberAction, updateMemberAction } from '@/app/actions/member.actions';
import { cn } from '@/lib/utils';

type MemberFormData = {
  id?: string;
  studentId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  department?: string;
  status?: string;
  notes?: string;
};

interface MemberFormProps {
  defaultValues?: MemberFormData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MemberForm({ defaultValues, onSuccess, onCancel }: MemberFormProps) {
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
        ? await updateMemberAction(defaultValues!.id!, formData)
        : await createMemberAction(formData);

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
      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='m-studentId'>
          Student ID <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='m-studentId'
          name='studentId'
          defaultValue={defaultValues?.studentId}
          placeholder='e.g. CSE-2021-001'
          required
          readOnly={isEditing}
          className={cn(isEditing && 'bg-muted')}
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='m-fullName'>
          Full Name <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='m-fullName'
          name='fullName'
          defaultValue={defaultValues?.fullName}
          placeholder='e.g. Rahim Uddin'
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='m-email'>
          Email <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='m-email'
          name='email'
          type='email'
          defaultValue={defaultValues?.email}
          placeholder='student@university.edu'
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='m-phone'>
          Phone <span className='text-destructive'>*</span>
        </Label>
        <Input
          id='m-phone'
          name='phone'
          defaultValue={defaultValues?.phone}
          placeholder='+880 1X XX XXX XXX'
          required
        />
      </div>

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='m-dept'>Department</Label>
        <Input
          id='m-dept'
          name='department'
          defaultValue={defaultValues?.department}
          placeholder='e.g. CSE, EEE'
        />
      </div>

      {isEditing && (
        <div className='flex flex-col gap-1.5'>
          <Label htmlFor='m-status'>Status</Label>
          <Select name='status' defaultValue={defaultValues?.status ?? 'ACTIVE'}>
            <SelectTrigger id='m-status' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='ACTIVE'>Active</SelectItem>
              <SelectItem value='INACTIVE'>Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className='flex flex-col gap-1.5'>
        <Label htmlFor='m-notes'>Notes</Label>
        <Input
          id='m-notes'
          name='notes'
          defaultValue={defaultValues?.notes}
          placeholder='Optional notes'
        />
      </div>

      {error && (
        <p className='text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2'>{error}</p>
      )}

      <div className='flex justify-end gap-2 pt-2'>
        {onCancel && (
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        )}
        <LoadingButton type='submit' loading={isPending}>
          {isEditing ? 'Save Changes' : 'Add Member'}
        </LoadingButton>
      </div>
    </form>
  );
}
