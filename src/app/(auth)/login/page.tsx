'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription
} from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { loginSchema } from '@/lib/schemas/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard/overview';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your input.');
      return;
    }

    setIsPending(true);
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className='w-full max-w-sm'>
      <CardHeader className='text-center pb-2'>
        {/* Robot icon branding */}
        <div className='bg-primary text-primary-foreground mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl shadow-sm'>
          <Icons.robot className='size-9' />
        </div>
        <h1 className='text-2xl font-bold tracking-tight'>Robotics Club</h1>
        <p className='text-lg font-semibold text-muted-foreground -mt-1'>Equipment Tracker</p>
        <CardDescription className='text-xs mt-2 leading-relaxed'>
          Track equipment. Know who has what.
          <br />
          Never lose track again.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              autoComplete='email'
              placeholder='you@example.com'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className='space-y-1.5'>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              name='password'
              type='password'
              autoComplete='current-password'
              placeholder='••••••••'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          {error && (
            <p role='alert' className='text-destructive text-sm'>
              {error}
            </p>
          )}

          <LoadingButton type='submit' className='w-full' loading={isPending} disabled={isPending}>
            Sign in
          </LoadingButton>
        </form>
      </CardContent>
    </Card>
  );
}
