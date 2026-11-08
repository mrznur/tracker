import PageContainer from '@/components/layout/page-container';
import {
  getDashboardStats,
  getDueSoon,
  getMostOverdue,
  type DueSoonLoan,
  type OverdueLoan
} from '@/server/services/dashboard.service';
import { getTodayInAppTimezone } from '@/server/timezone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import type { Metadata } from 'next';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Dashboard' };

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: process.env.APP_TIMEZONE ?? 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function daysRemaining(dueDate: Date | string): number {
  const today = getTodayInAppTimezone();
  const due = new Date(dueDate);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function OverviewPage() {
  const [stats, dueSoon, mostOverdue] = await Promise.all([
    getDashboardStats(),
    getDueSoon(3),
    getMostOverdue(5)
  ]);

  const dueSoonLoans = dueSoon as DueSoonLoan[];
  const overdueLoans = mostOverdue as OverdueLoan[];

  const summaryCards = [
    {
      title: 'Total Items',
      value: stats.totalItems,
      description: 'Active equipment (not retired)',
      icon: Icons.cpu,
      href: '/dashboard/equipment',
      className: ''
    },
    {
      title: 'Currently Borrowed',
      value: stats.borrowed,
      description: 'Items out on loan',
      icon: Icons.arrowsExchange,
      href: '/dashboard/loans',
      className: ''
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      description: 'Items past due date — action needed',
      icon: Icons.warning,
      href: '/dashboard/overdue',
      className:
        stats.overdue > 0 ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/20' : '',
      pulse: stats.overdue > 0
    },
    {
      title: 'Available',
      value: stats.available,
      description: 'Ready to borrow',
      icon: Icons.circleCheck,
      href: '/dashboard/equipment?status=AVAILABLE',
      className: '',
      pulse: false
    }
  ];

  return (
    <PageContainer pageTitle='Dashboard' pageDescription='Robotics Club equipment lending overview'>
      <div className='flex flex-1 flex-col gap-6'>
        {/* Summary Cards */}
        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className='relative'>
                {card.title === 'Overdue' && stats.overdue > 0 && (
                  <span
                    className='absolute inset-0 rounded-lg border-2 border-red-400 animate-pulse pointer-events-none z-10'
                    aria-hidden='true'
                  />
                )}
                <Link href={card.href}>
                  <Card
                    className={cn(
                      'hover:shadow-md transition-shadow cursor-pointer',
                      card.className
                    )}
                  >
                    <CardHeader>
                      <div className='flex items-center justify-between'>
                        <CardDescription>{card.title}</CardDescription>
                        <Icon className='size-4 text-muted-foreground' />
                      </div>
                      <CardTitle className='text-3xl font-bold tabular-nums'>
                        {card.value}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className='text-xs text-muted-foreground'>{card.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            );
          })}
        </div>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Due Soon */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Icons.clock className='size-4 text-muted-foreground' />
                <CardTitle className='text-base'>Due Today / Next 3 Days</CardTitle>
              </div>
              <CardDescription>Items due back soon</CardDescription>
            </CardHeader>
            <CardContent>
              {dueSoonLoans.length === 0 ? (
                <p className='text-sm text-muted-foreground py-4 text-center'>
                  No items due in the next 3 days. All clear!
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead className='text-right'>Days Left</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueSoonLoans.map((loan) => {
                      const days = daysRemaining(loan.dueDate);
                      return (
                        <TableRow key={loan.id}>
                          <TableCell>
                            <div className='font-medium'>{loan.member.fullName}</div>
                            <div className='text-xs text-muted-foreground'>
                              {loan.member.studentId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{loan.equipment.name}</div>
                            <div className='text-xs text-muted-foreground font-mono'>
                              {loan.equipment.assetTag}
                            </div>
                          </TableCell>
                          <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
                          <TableCell className='text-right'>
                            <span
                              className={cn(
                                'text-sm font-medium',
                                days === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-foreground'
                              )}
                            >
                              {days === 0 ? 'Today' : `${days}d`}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Most Overdue */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Icons.warning className='size-4 text-red-500' />
                <CardTitle className='text-base'>Most Overdue</CardTitle>
              </div>
              <CardDescription>
                <Link href='/dashboard/overdue' className='text-primary hover:underline'>
                  View all overdue →
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueLoans.length === 0 ? (
                <p className='text-sm text-muted-foreground py-4 text-center'>
                  No overdue items. Great job! 🎉
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className='text-right'>Days Late</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdueLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell>
                          <div className='font-medium'>{loan.member.fullName}</div>
                          <div className='text-xs text-muted-foreground'>
                            {loan.member.studentId}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{loan.equipment.name}</div>
                          <div className='text-xs text-muted-foreground font-mono'>
                            {loan.equipment.assetTag}
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <span className='text-sm font-bold text-red-600 dark:text-red-400'>
                            {loan.daysLate}d
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
