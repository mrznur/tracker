import PageContainer from '@/components/layout/page-container';
import { getEquipmentById } from '@/server/services/equipment.service';
import { StatusBadge, ConditionBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

function timelineDotClass(loan: LoanRecord, today: Date): string {
  if (!loan.returnedAt) {
    const isOverdue = new Date(loan.dueDate) < today;
    return isOverdue ? 'bg-red-500' : 'bg-blue-500';
  }
  const cond = loan.returnCondition ?? 'GOOD';
  if (cond === 'DAMAGED') return 'bg-orange-500';
  if (cond === 'FAIR') return 'bg-amber-500';
  return 'bg-green-500';
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const equipment = await getEquipmentById(id);
  if (!equipment) return { title: 'Equipment Not Found' };
  const eq = equipment as { name: string; assetTag: string };
  return { title: `${eq.name} (${eq.assetTag})` };
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

type LoanRecord = {
  id: string;
  borrowedAt: Date;
  dueDate: Date;
  returnedAt: Date | null;
  returnCondition: string | null;
  purpose: string;
  notes: string | null;
  member: { id: string; fullName: string; studentId: string };
  issuedBy: { id: string; name: string };
  returnedTo?: { id: string; name: string } | null;
};

type EquipmentDetail = {
  id: string;
  assetTag: string;
  name: string;
  description: string | null;
  serialNumber: string | null;
  condition: string;
  status: string;
  storageLocation: string;
  purchaseDate: Date | null;
  createdAt: Date;
  category: { id: string; name: string };
  loans: LoanRecord[];
  loanHistory: LoanRecord[];
};

export default async function EquipmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const equipment = await getEquipmentById(id);
  if (!equipment) notFound();

  const eq = equipment as unknown as EquipmentDetail;
  const activeLoan = eq.loans?.[0] ?? null;

  return (
    <PageContainer
      pageTitle={eq.name}
      pageDescription={eq.assetTag}
      pageHeaderAction={
        <Button variant='outline' nativeButton={false} render={<Link href='/dashboard/equipment' />}>
          <Icons.chevronLeft className='size-4 mr-1' />
          Back to Equipment
        </Button>
      }
    >
      <div className='flex flex-col gap-6'>
        {/* Equipment details card */}
        <Card>
          <CardHeader>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <CardTitle className='text-xl'>{eq.name}</CardTitle>
                <CardDescription className='font-mono mt-1'>{eq.assetTag}</CardDescription>
              </div>
              <div className='flex gap-2'>
                <StatusBadge
                  status={eq.status as 'AVAILABLE' | 'BORROWED' | 'DAMAGED' | 'LOST' | 'RETIRED'}
                />
                <ConditionBadge condition={eq.condition as 'GOOD' | 'FAIR' | 'DAMAGED'} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
              <div>
                <dt className='text-xs text-muted-foreground'>Category</dt>
                <dd className='text-sm font-medium'>{eq.category.name}</dd>
              </div>
              <div>
                <dt className='text-xs text-muted-foreground'>Storage Location</dt>
                <dd className='text-sm font-medium'>{eq.storageLocation}</dd>
              </div>
              {eq.serialNumber && (
                <div>
                  <dt className='text-xs text-muted-foreground'>Serial Number</dt>
                  <dd className='text-sm font-medium font-mono'>{eq.serialNumber}</dd>
                </div>
              )}
              {eq.purchaseDate && (
                <div>
                  <dt className='text-xs text-muted-foreground'>Purchase Date</dt>
                  <dd className='text-sm font-medium'>{formatDate(eq.purchaseDate)}</dd>
                </div>
              )}
              <div>
                <dt className='text-xs text-muted-foreground'>Added</dt>
                <dd className='text-sm font-medium'>{formatDate(eq.createdAt)}</dd>
              </div>
              {eq.description && (
                <div className='sm:col-span-2'>
                  <dt className='text-xs text-muted-foreground'>Description</dt>
                  <dd className='text-sm'>{eq.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Active loan */}
        {activeLoan && (
          <Card className='border-amber-200 dark:border-amber-900'>
            <CardHeader>
              <CardTitle className='text-base flex items-center gap-2'>
                <Icons.clipboard className='size-4 text-amber-600' />
                Currently Borrowed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                <div>
                  <dt className='text-xs text-muted-foreground'>Borrower</dt>
                  <dd className='text-sm font-medium'>
                    <Link
                      href={`/dashboard/members/${activeLoan.member.id}`}
                      className='text-primary hover:underline'
                    >
                      {activeLoan.member.fullName}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className='text-xs text-muted-foreground'>Student ID</dt>
                  <dd className='text-sm font-medium'>{activeLoan.member.studentId}</dd>
                </div>
                <div>
                  <dt className='text-xs text-muted-foreground'>Borrowed On</dt>
                  <dd className='text-sm font-medium'>{formatDate(activeLoan.borrowedAt)}</dd>
                </div>
                <div>
                  <dt className='text-xs text-muted-foreground'>Due Date</dt>
                  <dd className='text-sm font-medium'>{formatDate(activeLoan.dueDate)}</dd>
                </div>
                <div>
                  <dt className='text-xs text-muted-foreground'>Purpose</dt>
                  <dd className='text-sm'>{activeLoan.purpose}</dd>
                </div>
                <div>
                  <dt className='text-xs text-muted-foreground'>Issued By</dt>
                  <dd className='text-sm'>{activeLoan.issuedBy.name}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Loan history */}
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>Loan History</CardTitle>
            <CardDescription>{eq.loanHistory.length} total loan(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {eq.loanHistory.length === 0 ? (
              <p className='text-sm text-muted-foreground py-6 text-center'>
                No loan history yet.
              </p>
            ) : (
              <ol className='relative ml-2'>
                {eq.loanHistory.map((loan, idx) => {
                  const isLast = idx === eq.loanHistory.length - 1;
                  return (
                    <li key={loan.id} className='flex gap-4 pb-6 relative'>
                      {/* Vertical connector line */}
                      {!isLast && (
                        <span
                          className='absolute left-[7px] top-4 bottom-0 w-px bg-border'
                          aria-hidden='true'
                        />
                      )}
                      {/* Dot */}
                      <span
                        className={`relative mt-1 flex size-3.5 shrink-0 rounded-full ${timelineDotClass(loan, new Date())}`}
                        aria-hidden='true'
                      />
                      {/* Content */}
                      <div className='flex flex-col gap-0.5 min-w-0'>
                        <div className='flex flex-wrap items-center gap-2'>
                          <Link
                            href={`/dashboard/members/${loan.member.id}`}
                            className='font-medium text-sm hover:underline'
                          >
                            {loan.member.fullName}
                          </Link>
                          <span className='text-xs text-muted-foreground font-mono'>
                            {loan.member.studentId}
                          </span>
                          {loan.returnCondition && (
                            <ConditionBadge
                              condition={loan.returnCondition as 'GOOD' | 'FAIR' | 'DAMAGED'}
                            />
                          )}
                          {!loan.returnedAt && (
                            <span
                              className={`text-xs font-medium ${
                                new Date(loan.dueDate) < new Date()
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-blue-600 dark:text-blue-400'
                              }`}
                            >
                              {new Date(loan.dueDate) < new Date() ? 'Overdue' : 'Active'}
                            </span>
                          )}
                        </div>
                        <p className='text-xs text-muted-foreground'>
                          {formatDate(loan.borrowedAt)} →{' '}
                          {loan.returnedAt ? formatDate(loan.returnedAt) : 'Still out'}
                        </p>
                        {loan.purpose && (
                          <p className='text-xs text-muted-foreground truncate max-w-sm'>
                            {loan.purpose}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
