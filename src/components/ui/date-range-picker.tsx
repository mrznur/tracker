'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface DateRange {
  from?: string; // ISO date string YYYY-MM-DD
  to?: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [from, setFrom] = React.useState(value?.from ?? '');
  const [to, setTo] = React.useState(value?.to ?? '');

  React.useEffect(() => {
    setFrom(value?.from ?? '');
    setTo(value?.to ?? '');
  }, [value?.from, value?.to]);

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFrom = e.target.value;
    setFrom(newFrom);
    onChange?.({ from: newFrom || undefined, to: to || undefined });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTo = e.target.value;
    setTo(newTo);
    onChange?.({ from: from || undefined, to: newTo || undefined });
  };

  const handleClear = () => {
    setFrom('');
    setTo('');
    onChange?.({});
  };

  const hasValue = from || to;

  return (
    <div className={cn('flex flex-wrap items-end gap-2', className)}>
      <div className='flex flex-col gap-1'>
        <Label htmlFor='date-from' className='text-xs text-muted-foreground'>
          From
        </Label>
        <Input
          id='date-from'
          type='date'
          value={from}
          onChange={handleFromChange}
          className='w-36'
        />
      </div>
      <div className='flex flex-col gap-1'>
        <Label htmlFor='date-to' className='text-xs text-muted-foreground'>
          To
        </Label>
        <Input
          id='date-to'
          type='date'
          value={to}
          onChange={handleToChange}
          min={from}
          className='w-36'
        />
      </div>
      {hasValue && (
        <Button variant='ghost' size='sm' type='button' onClick={handleClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
