import { prisma } from '@/server/db';
import { overdueWhereClause } from '@/server/timezone';

// Shape of a member row in the list view (includes computed counts)
export type MemberListItem = {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  department: string | null;
  status: string;
  notes: string | null;
  createdAt: Date;
  openLoansCount: number;
  overdueCount: number;
};

export type MemberListResult = {
  items: MemberListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type CreateMemberInput = {
  studentId: string;
  fullName: string;
  email: string;
  phone: string;
  department?: string;
  notes?: string;
};

export type UpdateMemberInput = Partial<{
  fullName: string;
  email: string;
  phone: string;
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  notes: string;
}>;

export async function getMemberList(
  params: { page?: number; pageSize?: number; search?: string; status?: string } = {}
): Promise<MemberListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [
      { fullName: { contains: term } },
      { studentId: { contains: term } },
      { email: { contains: term } }
    ];
  }

  if (params.status) where.status = params.status;

  const overdueClause = overdueWhereClause();

  const [members, total] = await prisma.$transaction([
    prisma.member.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { fullName: 'asc' },
      include: {
        loans: { select: { id: true, returnedAt: true, dueDate: true } }
      }
    }),
    prisma.member.count({ where })
  ]);

  const items: MemberListItem[] = members.map((member) => {
    const openLoans = member.loans.filter((l) => l.returnedAt === null);
    const overdueLoans = openLoans.filter((l) => l.dueDate < overdueClause.dueDate.lt);
    return {
      id: member.id,
      studentId: member.studentId,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      department: member.department,
      status: member.status,
      notes: member.notes,
      createdAt: member.createdAt,
      openLoansCount: openLoans.length,
      overdueCount: overdueLoans.length
    };
  });

  return { items, total, page, pageSize };
}

export async function getMemberById(id: string) {
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      loans: {
        where: { returnedAt: null },
        orderBy: { dueDate: 'asc' },
        include: {
          equipment: { include: { category: true } },
          issuedBy: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!member) return null;

  const loanHistory = await prisma.loan.findMany({
    where: { memberId: id },
    orderBy: { borrowedAt: 'desc' },
    include: {
      equipment: { include: { category: true } },
      issuedBy: { select: { id: true, name: true } },
      returnedTo: { select: { id: true, name: true } }
    }
  });

  return { ...member, loanHistory };
}

export async function createMember(input: CreateMemberInput) {
  const existingById = await prisma.member.findUnique({ where: { studentId: input.studentId } });
  if (existingById) {
    throw new Error(`A member with student ID "${input.studentId}" already exists.`);
  }

  const existingByEmail = await prisma.member.findFirst({ where: { email: input.email.trim() } });
  if (existingByEmail) {
    throw new Error(`A member with email "${input.email}" already exists.`);
  }

  return prisma.member.create({
    data: {
      studentId: input.studentId.trim(),
      fullName: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      department: input.department?.trim() ?? null,
      notes: input.notes?.trim() ?? null,
      status: 'ACTIVE'
    }
  });
}

export async function updateMember(id: string, input: UpdateMemberInput) {
  const existing = await prisma.member.findUnique({ where: { id } });
  if (!existing) throw new Error('Member not found.');

  if (input.status === 'INACTIVE') {
    const openLoansCount = await prisma.loan.count({ where: { memberId: id, returnedAt: null } });
    if (openLoansCount > 0) {
      throw new Error(
        'Cannot deactivate a member who currently has items borrowed. Return all items first.'
      );
    }
  }

  const data: Record<string, unknown> = {};
  if (input.fullName !== undefined) data.fullName = input.fullName.trim();
  if (input.email !== undefined) data.email = input.email.trim();
  if (input.phone !== undefined) data.phone = input.phone.trim();
  if (input.department !== undefined) data.department = input.department.trim();
  if (input.status !== undefined) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes.trim();

  return prisma.member.update({ where: { id }, data });
}
