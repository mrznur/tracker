'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { Label } from '@/components/ui/label';
import { LoadingButton } from '@/components/ui/loading-button';
import { RoleBadge, MemberStatusBadge } from '@/components/ui/status-badge';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  createUserAction,
  deactivateUserAction,
  activateUserAction,
  resetPasswordAction,
  changeRoleAction
} from '@/app/actions/user.actions';

type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'LAB_ASSISTANT' | 'EXECUTIVE';
  isActive: boolean;
  createdAt: Date | string;
};

interface UsersTableProps {
  users: User[];
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function generatePassword(): string {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();

  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  // Reset password dialog
  const [resetUser, setResetUser] = React.useState<User | null>(null);
  const [newPassword, setNewPassword] = React.useState('');
  const [resetDone, setResetDone] = React.useState(false);
  const [resetPending, setResetPending] = React.useState(false);

  // Change role dialog
  const [roleUser, setRoleUser] = React.useState<User | null>(null);
  const [newRole, setNewRole] = React.useState<string>('');
  const [rolePending, setRolePending] = React.useState(false);
  const [roleError, setRoleError] = React.useState<string | null>(null);

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAddError(null);
    setIsPending(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await createUserAction(formData);
      if (!result.success) {
        setAddError(result.error);
        return;
      }
      router.refresh();
      setShowAddDialog(false);
    } finally {
      setIsPending(false);
    }
  }

  async function handleToggleActive(user: User) {
    if (user.isActive) {
      await deactivateUserAction(user.id);
    } else {
      await activateUserAction(user.id);
    }
    router.refresh();
  }

  async function handleResetPassword() {
    if (!resetUser || !newPassword) return;
    setResetPending(true);
    await resetPasswordAction(resetUser.id, newPassword);
    setResetPending(false);
    setResetDone(true);
  }

  async function handleChangeRole(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!roleUser) return;
    setRoleError(null);
    setRolePending(true);
    const formData = new FormData(e.currentTarget);
    const result = await changeRoleAction(roleUser.id, formData);
    setRolePending(false);
    if (!result.success) {
      setRoleError(result.error);
      return;
    }
    router.refresh();
    setRoleUser(null);
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex justify-end'>
        <Button onClick={() => setShowAddDialog(true)}>
          <Icons.add className='size-4 mr-1' />
          Add User
        </Button>
      </div>

      <div className='rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className='w-40'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='py-8 text-center text-muted-foreground'>
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className='font-medium'>{user.name}</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={user.role} />
                  </TableCell>
                  <TableCell>
                    <MemberStatusBadge status={user.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </TableCell>
                  <TableCell className='text-sm'>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='xs'
                        onClick={() => handleToggleActive(user)}
                        aria-label={user.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        variant='ghost'
                        size='xs'
                        onClick={() => {
                          setResetUser(user);
                          setNewPassword(generatePassword());
                          setResetDone(false);
                        }}
                      >
                        Reset PW
                      </Button>
                      <Button
                        variant='ghost'
                        size='xs'
                        onClick={() => {
                          setRoleUser(user);
                          setNewRole(user.role);
                          setRoleError(null);
                        }}
                      >
                        Role
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>Create a new system user account.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='u-name'>Name</Label>
              <Input id='u-name' name='name' required />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='u-email'>Email</Label>
              <Input id='u-email' name='email' type='email' required />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='u-pw'>Password</Label>
              <Input id='u-pw' name='password' type='password' minLength={8} required />
            </div>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='u-role'>Role</Label>
              <Select name='role' defaultValue='LAB_ASSISTANT'>
                <SelectTrigger id='u-role' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ADMIN'>Admin</SelectItem>
                  <SelectItem value='LAB_ASSISTANT'>Lab Assistant</SelectItem>
                  <SelectItem value='EXECUTIVE'>Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {addError && (
              <p className='text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2'>
                {addError}
              </p>
            )}
            <DialogFooter showCloseButton>
              <LoadingButton type='submit' loading={isPending}>
                Create User
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for <strong>{resetUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          {resetDone ? (
            <div className='flex flex-col gap-3'>
              <p className='text-sm text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-md px-3 py-2'>
                Password reset successfully. New password (shown once):
              </p>
              <code className='block font-mono text-sm bg-muted rounded px-3 py-2 break-all select-all'>
                {newPassword}
              </code>
              <Button variant='outline' onClick={() => setResetUser(null)}>
                Close
              </Button>
            </div>
          ) : (
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-1.5'>
                <Label>Generated Password</Label>
                <div className='flex gap-2'>
                  <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => setNewPassword(generatePassword())}
                    aria-label='Regenerate password'
                  >
                    <Icons.spinner className='size-4' />
                  </Button>
                </div>
              </div>
              <LoadingButton loading={resetPending} onClick={handleResetPassword}>
                Reset Password
              </LoadingButton>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={!!roleUser} onOpenChange={(o) => !o && setRoleUser(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Change role for <strong>{roleUser?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleChangeRole} className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <Label htmlFor='cr-role'>New Role</Label>
              <Select name='role' value={newRole} onValueChange={(v) => v && setNewRole(v)}>
                <SelectTrigger id='cr-role' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ADMIN'>Admin</SelectItem>
                  <SelectItem value='LAB_ASSISTANT'>Lab Assistant</SelectItem>
                  <SelectItem value='EXECUTIVE'>Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {roleError && (
              <p className='text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2'>
                {roleError}
              </p>
            )}
            <DialogFooter showCloseButton>
              <LoadingButton type='submit' loading={rolePending}>
                Save Role
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
