'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Icons } from '@/components/icons';

type OverdueLoan = {
  id: string;
  borrowedAt: Date | string;
  dueDate: Date | string;
  daysLate: number;
  member: {
    id: string;
    fullName: string;
    studentId: string;
    email: string;
    phone: string;
  };
  equipment: {
    id: string;
    assetTag: string;
    name: string;
  };
};

interface OverdueTableProps {
  loans: OverdueLoan[];
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: process.env.NEXT_PUBLIC_APP_TIMEZONE ?? 'Asia/Dhaka',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function buildReminderMessage(loan: OverdueLoan): string {
  const borrowed = formatDate(loan.borrowedAt);
  const due = formatDate(loan.dueDate);
  return `Hi ${loan.member.fullName}, the ${loan.equipment.name} (${loan.equipment.assetTag}) borrowed on ${borrowed} was due on ${due}. Please return it to the Robotics Club room. Thank you.`;
}

export function OverdueTable({ loans }: OverdueTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [allCopied, setAllCopied] = React.useState(false);

  async function copyAllReminders() {
    const messages = loans.map(buildReminderMessage).join('\n\n');
    try {
      await navigator.clipboard.writeText(messages);
    } catch {
      const el = document.createElement('textarea');
      el.value = messages;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  }

  async function copyReminder(loan: OverdueLoan) {
    const message = buildReminderMessage(loan);
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      const el = document.createElement('textarea');
      el.value = message;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(loan.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loans.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <Icons.circleCheck className='size-12 text-green-500 mb-3' />
        <p className='text-lg font-medium'>No overdue items. Great job! 🎉</p>
        <p className='text-sm text-muted-foreground mt-1'>
          All borrowed equipment is within its due date.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className='flex justify-end mb-3'>
        <Button variant='outline' size='sm' onClick={copyAllReminders} className='gap-2'>
          {allCopied ? (
            <>
              <Icons.check className='size-4' /> Copied {loans.length} reminder
              {loans.length !== 1 ? 's' : ''}!
            </>
          ) : (
            <>
              <Icons.clipboard className='size-4' /> Copy all reminders ({loans.length})
            </>
          )}
        </Button>
      </div>
      <div className='rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Asset Tag</TableHead>
            <TableHead>Borrowed</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className='text-right'>Days Late</TableHead>
            <TableHead className='w-32'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan.id} className='bg-red-50/40 dark:bg-red-950/10'>
              <TableCell>
                <div className='font-medium'>{loan.member.fullName}</div>
                <div className='text-xs text-muted-foreground font-mono'>
                  {loan.member.studentId}
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-1'>
                  <span className='text-sm'>{loan.member.phone}</span>
                  <CopyButton value={loan.member.phone} size='icon-xs' />
                </div>
              </TableCell>
              <TableCell>
                <div className='flex items-center gap-1'>
                  <span className='text-sm truncate max-w-36'>{loan.member.email}</span>
                  <CopyButton value={loan.member.email} size='icon-xs' />
                </div>
              </TableCell>
              <TableCell className='font-medium'>{loan.equipment.name}</TableCell>
              <TableCell className='font-mono text-xs'>{loan.equipment.assetTag}</TableCell>
              <TableCell className='text-sm'>{formatDate(loan.borrowedAt)}</TableCell>
              <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
              <TableCell className='text-right'>
                <span className='text-sm font-bold text-red-600 dark:text-red-400'>
                  {loan.daysLate}d
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant='outline'
                  size='xs'
                  onClick={() => copyReminder(loan)}
                  className='gap-1.5 text-xs'
                >
                  {copiedId === loan.id ? (
                    <>
                      <Icons.check className='size-3' />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Icons.clipboard className='size-3' />
                      Copy Reminder
                    </>
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </div>
  );
}