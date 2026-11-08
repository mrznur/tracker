'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function OverviewError({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const retry = () => {
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
      <div className='flex items-start gap-3'>
        <Icons.warning className='mt-0.5 h-5 w-5 shrink-0 text-destructive' aria-hidden='true' />
        <div className='flex-1'>
          <p className='text-sm font-medium text-destructive'>Failed to load dashboard</p>
          <p className='mt-1 text-sm text-muted-foreground'>{error.message}</p>
        </div>
        <Button variant='outline' size='sm' onClick={retry} disabled={isPending}>
          {isPending ? (
            <>
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' aria-hidden='true' />
              Retrying...
            </>
          ) : (
            'Try again'
          )}
        </Button>
      </div>
      <span role='status' aria-live='polite' className='sr-only'>
        {isPending ? 'Retrying' : ''}
      </span>
    </div>
  );
}
