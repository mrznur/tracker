import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { getTodayInAppTimezone, overdueWhereClause } from '@/server/timezone';

export type DashboardStats = {
  totalItems: number;
  borrowed: number;
  overdue: number;
  available: number;
};

type LoanWithRelations = Prisma.LoanGetPayload<{
  include: {
    equipment: { select: { id: true; name: true; assetTag: true } };
    member: { select: { id: true; fullName: true; studentId: true } };
  };
}>;

export type DueSoonLoan = LoanWithRelations;
export type OverdueLoan = LoanWithRelations & { daysLate: number };

export async function getDashboardStats(): Promise<DashboardStats> {
  const [totalItems, borrowed, overdue, available] = await prisma.$transaction([
    prisma.equipment.count(),
    prisma.equipment.count({ where: { status: 'BORROWED' } }),
    prisma.loan.count({ where: overdueWhereClause() }),
    prisma.equipment.count({ where: { status: 'AVAILABLE' } })
  ]);

  return { totalItems, borrowed, overdue, available };
}

export async function getDueSoon(days = 3): Promise<DueSoonLoan[]> {
  const today = getTodayInAppTimezone();
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() + days);

  // Due soon: not yet overdue (dueDate >= today) and due within `days` days
  const loans = await prisma.loan.findMany({
    where: {
      returnedAt: null,
      dueDate: {
        gte: today,
        lt: cutoff
      }
    },
    orderBy: { dueDate: 'asc' },
    include: {
      equipment: { select: { id: true, name: true, assetTag: true } },
      member: { select: { id: true, fullName: true, studentId: true } }
    }
  });

  return loans;
}

export async function getMostOverdue(limit = 10): Promise<OverdueLoan[]> {
  const overdue = overdueWhereClause();

  const loans = await prisma.loan.findMany({
    where: overdue,
    orderBy: { dueDate: 'asc' }, // oldest due date = most overdue
    take: limit,
    include: {
      equipment: { select: { id: true, name: true, assetTag: true } },
      member: { select: { id: true, fullName: true, studentId: true } }
    }
  });

  const today = getTodayInAppTimezone();

  return loans.map((loan) => {
    const daysLate = Math.floor((today.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    return { ...loan, daysLate };
  });
}
