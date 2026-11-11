import { prisma } from '@/server/db';
import { getTodayInAppTimezone, overdueWhereClause } from '@/server/timezone';

export async function getCurrentlyBorrowed() {
  const loans = await prisma.loan.findMany({
    where: { returnedAt: null },
    orderBy: { dueDate: 'asc' },
    include: {
      equipment: { include: { category: true } },
      member: { select: { id: true, fullName: true, studentId: true, email: true } },
      issuedBy: { select: { id: true, name: true } }
    }
  });

  const today = getTodayInAppTimezone();

  return loans.map((loan) => ({ ...loan, isOverdue: loan.dueDate < today }));
}

export async function getOverdueReport() {
  const loans = await prisma.loan.findMany({
    where: overdueWhereClause(),
    orderBy: { dueDate: 'asc' },
    include: {
      equipment: { include: { category: true } },
      member: { select: { id: true, fullName: true, studentId: true, email: true, phone: true } },
      issuedBy: { select: { id: true, name: true } }
    }
  });

  const today = getTodayInAppTimezone();

  return loans
    .map((loan) => ({
      ...loan,
      daysLate: Math.floor((today.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => b.daysLate - a.daysLate);
}

export async function getLostOrDamagedEquipment() {
  return prisma.equipment.findMany({
    where: { status: { in: ['DAMAGED', 'LOST'] } },
    orderBy: [{ status: 'asc' }, { name: 'asc' }],
    include: {
      category: true,
      loans: {
        orderBy: { borrowedAt: 'desc' },
        take: 1,
        include: {
          member: { select: { id: true, fullName: true, studentId: true } }
        }
      }
    }
  });
}

export async function getMostBorrowedItems(params: {
  from?: Date;
  to?: Date;
  limit?: number;
} = {}) {
  const limit = params.limit ?? 10;
  const loanWhere: Record<string, unknown> = {};
  if (params.from || params.to) {
    const dateFilter: Record<string, unknown> = {};
    if (params.from) dateFilter.gte = params.from;
    if (params.to) dateFilter.lte = params.to;
    loanWhere.borrowedAt = dateFilter;
  }

  const loanCounts = await prisma.loan.groupBy({
    by: ['equipmentId'],
    where: loanWhere,
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: limit
  });

  if (loanCounts.length === 0) return [];

  const equipment = await prisma.equipment.findMany({
    where: { id: { in: loanCounts.map((r) => r.equipmentId) } },
    include: { category: true }
  });

  const countMap = new Map(loanCounts.map((r) => [r.equipmentId, r._count.id]));

  return equipment
    .map((eq) => ({ ...eq, totalLoans: countMap.get(eq.id) ?? 0 }))
    .sort((a, b) => b.totalLoans - a.totalLoans);
}

export async function getLoansByMember(params: {
  from?: Date;
  to?: Date;
  memberId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, params.pageSize ?? 20);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (params.memberId) where.memberId = params.memberId;
  if (params.from || params.to) {
    const dateFilter: Record<string, unknown> = {};
    if (params.from) dateFilter.gte = params.from;
    if (params.to) dateFilter.lte = params.to;
    where.borrowedAt = dateFilter;
  }

  const [loans, total] = await prisma.$transaction([
    prisma.loan.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { borrowedAt: 'desc' },
      include: {
        equipment: { select: { id: true, name: true, assetTag: true } },
        member: { select: { id: true, fullName: true, studentId: true } },
        issuedBy: { select: { id: true, name: true } },
        returnedTo: { select: { id: true, name: true } }
      }
    }),
    prisma.loan.count({ where })
  ]);

  return { items: loans, total, page, pageSize };
}

export async function getNeverBorrowedItems() {
  return prisma.equipment.findMany({
    where: { loans: { none: {} } },
    orderBy: { assetTag: 'asc' },
    include: { category: true }
  });
}
