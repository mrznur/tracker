import PageContainer from '@/components/layout/page-container';
import { getMemberById } from '@/server/services/member.service';
import { MemberStatusBadge, StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) return { title: 'Member Not Found' };
  const m = member as { fullName: string; studentId: string };
  return { title: `${m.fullName} (${m.studentId})` };
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-CA', {
    timeZone: process.env.APP_TIMEZONE ?? 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

type OpenLoan = {
  id: string;
  borrowedAt: Date;
  dueDate: Date;
  purpose: string;
  equipment: {
    id: string;
    assetTag: string;
    name: string;
    status: string;
    category: { name: string };
  };
  issuedBy: { id: string; name: string };
};

type LoanHistoryItem = {
  id: string;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt: Date | null;
  returnCondition: string | null;
  purpose: string;
  equipment: { id: string; assetTag: string; name: string };
  issuedBy: { id: string; name: string };
  returnedTo?: { id: string; name: string } | null;
};

type MemberDetail = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  loans: OpenLoan[];
  loanHistory: LoanHistoryItem[];
};

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params;
  const member = await getMemberById(id);
  if (!member) notFound();

  const m = member as unknown as MemberDetail;

  const today = new Date();
  const overdueLoans = m.loans.filter((loan) => new Date(loan.dueDate) < today);

  return (
    <PageContainer
      pageTitle={m.fullName}
      pageDescription={m.studentId}
      pageHeaderAction={
        <Button variant='outline' render={<Link href='/dashboard/members' />}>
          <Icons.chevronLeft className='size-4 mr-1' />
          Back to Members
        </Button>
      }
    >
      <div className='flex flex-col gap-6'>
        {/* Overdue warning banner */}
        {overdueLoans.length > 0 && (
          <Alert variant='destructive'>
            <Icons.warning className='size-4' />
            <AlertTitle>Overdue Items</AlertTitle>
            <AlertDescription>
              <ul className='mt-1 space-y-0.5'>
                {overdueLoans.map((loan) => {
                  const daysOverdue = Math.floor(
                    (today.getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <li key={loan.id}>
                      {loan.equipment.assetTag} · {loan.equipment.name} — {daysOverdue} day
                      {daysOverdue !== 1 ? 's' : ''} overdue
                    </li>
                  );
                })}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Member info card */}
        <Card>
          <CardHeader>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <CardTitle className='text-xl'>{m.fullName}</CardTitle>
                <CardDescription className='font-mono mt-1'>{m.studentId}</CardDescription>
              </div>
              <MemberStatusBadge status={m.status as 'ACTIVE' | 'INACTIVE'} />
            </div>
          </CardHeader>
          <CardContent>
            <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              <div>
                <dt className='text-xs text-muted-foreground'>Email</dt>
                <dd className='text-sm font-medium'>{m.email}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Phone</dt>
                <dd className='text-sm font-medium'>{m.phone}</dd>
              </div>
              {m.department && (
                <div>
                  <dt className='text-xs text-muted-foreground'>Department</dt>
                  <dd className='text-sm font-medium'>{m.department}</dd>
                </div>
              )}
              <div>
                <dt className='text-xs text-muted-foreground'>Member Since</dt>
                <dd className='text-sm font-medium'>{formatDate(m.createdAt)}</dd>
              </div>
              {m.notes && (
                <div className='sm:col-span-2'>
                  <dt className='text-xs text-muted-foreground'>Notes</dt>
                  <dd className='text-sm'>{m.notes}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Currently held items */}
        {m.loans.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                <Icons.clipboard className='size-4 text-amber-600' />
                Currently Holding ({m.loans.length} item{m.loans.length !== 1 ? 's' : ''})
              </CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Tag</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Purpose</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.loans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className='font-mono text-xs'>
                        <Link
                          href={`/dashboard/equipment/${loan.equipment.id}`}
                          className='text-primary hover:underline'
                        >
                          {loan.equipment.assetTag}
                        </Link>
                      </TableCell>
                      <TableCell className='font-medium'>{loan.equipment.name}</TableCell>
                      <TableCell className='text-sm text-muted-foreground'>
                        {loan.equipment.category.name}
                      </TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.borrowedAt)}</TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
                      <TableCell className='text-sm max-w-xs truncate'>{loan.purpose}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Loan history */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Loan History</CardTitle>
            <CardDescription>{m.loanHistory.length} total loan(s)</CardDescription>
          </CardHeader>
          <CardContent className='p-0'>
            {m.loanHistory.length === 0 ? (
              <p className='text-sm text-muted-foreground py-6 text-center'>
                This member has no loan history.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Borrowed</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Returned</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Purpose</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.loanHistory.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/equipment/${loan.equipment.id}`}
                          className='font-medium hover:underline'
                        >
                          {loan.equipment.name}
                        </Link>
                        <div className='text-xs text-muted-foreground font-mono'>
                          {loan.equipment.assetTag}
                        </div>
                      </TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.borrowedAt)}</TableCell>
                      <TableCell className='text-sm'>{formatDate(loan.dueDate)}</TableCell>
                      <TableCell className='text-sm'>
                        {loan.returnedAt ? (
                          formatDate(loan.returnedAt)
                        ) : (
                          <span className='text-amber-600 font-medium text-xs'>Active</span>
                        )}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {loan.returnCondition ? (
                          <StatusBadge
                            status={
                              loan.returnCondition as
                                | 'AVAILABLE'
                                | 'BORROWED'
                                | 'DAMAGED'
                                | 'LOST'
                                | 'RETIRED'
                            }
                          />
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell className='text-sm max-w-xs truncate'>{loan.purpose}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
