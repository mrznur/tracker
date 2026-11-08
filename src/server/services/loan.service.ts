import { prisma } from '@/server/db';
import {
  getTodayInAppTimezone,
  overdueWhereClause,
  normalizeDateToTimezone
} from '@/server/timezone';

export type LoanListParams = {
  page?: number;
  pageSize?: number;
  tab?: 'active' | 'overdue' | 'returned' | 'all';
};

export type LoanListResult = {
  items: object[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getLoanList(params: LoanListParams = {}): Promise<LoanListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;
  const tab = params.tab ?? 'all';

  let where: Record<string, unknown> = {};

  const today = getTodayInAppTimezone();

  if (tab === 'active') {
    where = { returnedAt: null, dueDate: { gte: today } };
  } else if (tab === 'overdue') {
    where = overdueWhereClause();
  } else if (tab === 'returned') {
    where = { returnedAt: { not: null } };
  }
  // 'all' — no filter

  const include = {
    equipment: { select: { id: true, assetTag: true, name: true, status: true } },
    member: { select: { id: true, fullName: true, studentId: true } },
    issuedBy: { select: { id: true, name: true } },
    returnedTo: { select: { id: true, name: true } }
  };

  const [items, total] = await prisma.$transaction([
    prisma.loan.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { borrowedAt: 'desc' },
      include
    }),
    prisma.loan.count({ where })
  ]);

  return { items, total, page, pageSize };
}

export type CreateLoanInput = {
  equipmentId: string;
  memberId: string;
  issuedByUserId: string;
  dueDate?: Date;
  purpose: string;
  notes?: string;
};

export type LoanWarning = {
  type: 'HIGH_LOAN_COUNT' | 'HAS_OVERDUE';
  message: string;
  details?: unknown;
};

export type CreateLoanResult = {
  loan: object;
  warnings: LoanWarning[];
};

export async function createLoan(input: CreateLoanInput): Promise<CreateLoanResult> {
  const { equipmentId, memberId, issuedByUserId, purpose, notes } = input;

  if (!purpose || purpose.trim() === '') {
    throw new Error('Purpose is required.');
  }

  const today = getTodayInAppTimezone();

  // Resolve due date
  const loanDefaultDays = parseInt(process.env.LOAN_DEFAULT_DAYS ?? '7', 10);
  let dueDate = input.dueDate;
  if (!dueDate) {
    dueDate = new Date(today);
    dueDate.setUTCDate(dueDate.getUTCDate() + loanDefaultDays);
  } else {
    // Validate: must not be in the past
    const dueDateNormalized = normalizeDateToTimezone(dueDate);
    if (dueDateNormalized < today) {
      throw new Error('Due date cannot be in the past.');
    }
  }

  // Pre-flight checks (outside transaction for better error messages)
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      loans: {
        where: { returnedAt: null },
        include: { member: true },
        take: 1
      }
    }
  });

  if (!equipment) {
    throw new Error('Equipment not found.');
  }

  if (equipment.status !== 'AVAILABLE') {
    const activeLoan = equipment.loans[0];
    if (equipment.status === 'BORROWED' && activeLoan) {
      const dueDateStr = activeLoan.dueDate.toLocaleDateString('en-CA', {
        timeZone: process.env.APP_TIMEZONE ?? 'Asia/Dhaka'
      });
      throw new Error(
        `This item is already borrowed by ${activeLoan.member.fullName} (due ${dueDateStr}).`
      );
    }
    if (equipment.status === 'DAMAGED') {
      throw new Error('This item is damaged and cannot be loaned.');
    }
    if (equipment.status === 'LOST') {
      throw new Error('This item is lost and cannot be loaned.');
    }
    if (equipment.status === 'RETIRED') {
      throw new Error('This item has been retired and cannot be loaned.');
    }
    throw new Error(`This item is not available for loan (status: ${equipment.status}).`);
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) {
    throw new Error('Member not found.');
  }
  if (member.status !== 'ACTIVE') {
    throw new Error('This member is inactive and cannot borrow items.');
  }

  // Collect warnings
  const warnings: LoanWarning[] = [];

  const warnLimit = parseInt(process.env.MEMBER_LOAN_WARN_LIMIT ?? '5', 10);
  const openLoansCount = await prisma.loan.count({
    where: { memberId, returnedAt: null }
  });
  if (openLoansCount >= warnLimit) {
    warnings.push({
      type: 'HIGH_LOAN_COUNT',
      message: `This member currently has ${openLoansCount} open loan(s), which is at or above the warning limit of ${warnLimit}.`,
      details: { openLoansCount, limit: warnLimit }
    });
  }

  const overdueLoans = await prisma.loan.findMany({
    where: { memberId, ...overdueWhereClause() },
    include: { equipment: { select: { name: true, assetTag: true } } }
  });
  if (overdueLoans.length > 0) {
    warnings.push({
      type: 'HAS_OVERDUE',
      message: `This member has ${overdueLoans.length} overdue item(s).`,
      details: overdueLoans.map((l) => ({
        loanId: l.id,
        equipmentName: l.equipment.name,
        assetTag: l.equipment.assetTag,
        dueDate: l.dueDate
      }))
    });
  }

  // Transaction: double-check availability and create loan
  const loan = await prisma.$transaction(async (tx) => {
    // Race-condition guard: re-read status inside transaction
    const locked = await tx.equipment.findUnique({ where: { id: equipmentId } });
    if (!locked || locked.status !== 'AVAILABLE') {
      throw new Error('This item is no longer available. Someone else may have just borrowed it.');
    }

    const newLoan = await tx.loan.create({
      data: {
        equipmentId,
        memberId,
        issuedByUserId,
        dueDate,
        purpose: purpose.trim(),
        notes: notes?.trim() ?? null
      },
      include: {
        equipment: true,
        member: true,
        issuedBy: { select: { id: true, name: true, email: true } }
      }
    });

    await tx.equipment.update({
      where: { id: equipmentId },
      data: { status: 'BORROWED' }
    });

    return newLoan;
  });

  return { loan, warnings };
}

export async function returnLoan(input: {
  loanId: string;
  returnedToUserId: string;
  returnCondition: 'GOOD' | 'FAIR' | 'DAMAGED' | 'LOST';
  notes?: string;
}): Promise<object> {
  const { loanId, returnedToUserId, returnCondition, notes } = input;

  const existing = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { equipment: true, member: true }
  });

  if (!existing) {
    throw new Error('Loan not found.');
  }
  if (existing.returnedAt !== null) {
    throw new Error('This loan has already been returned.');
  }

  const updatedLoan = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const newNotes = notes?.trim()
      ? [existing.notes, `Returned (${returnCondition}): ${notes.trim()}`]
          .filter(Boolean)
          .join('\n')
      : existing.notes;

    const loan = await tx.loan.update({
      where: { id: loanId },
      data: {
        returnedAt: now,
        returnedToUserId,
        returnCondition,
        notes: newNotes
      },
      include: {
        equipment: true,
        member: true,
        issuedBy: { select: { id: true, name: true, email: true } },
        returnedTo: { select: { id: true, name: true, email: true } }
      }
    });

    // Update equipment status and condition
    let newStatus: string;
    let newCondition: string | undefined;

    if (returnCondition === 'GOOD' || returnCondition === 'FAIR') {
      newStatus = 'AVAILABLE';
      newCondition = returnCondition;
    } else if (returnCondition === 'DAMAGED') {
      newStatus = 'DAMAGED';
      newCondition = 'DAMAGED';
    } else {
      // LOST
      newStatus = 'LOST';
    }

    await tx.equipment.update({
      where: { id: existing.equipmentId },
      data: {
        status: newStatus,
        ...(newCondition !== undefined ? { condition: newCondition } : {})
      }
    });

    return loan;
  });

  return updatedLoan;
}

export async function extendLoan(input: {
  loanId: string;
  newDueDate: Date;
  reason: string;
}): Promise<object> {
  const { loanId, newDueDate, reason } = input;

  if (!reason || reason.trim() === '') {
    throw new Error('A reason is required to extend a loan.');
  }

  const existing = await prisma.loan.findUnique({ where: { id: loanId } });
  if (!existing) {
    throw new Error('Loan not found.');
  }
  if (existing.returnedAt !== null) {
    throw new Error('Cannot extend a returned loan.');
  }

  const newDueDateNormalized = normalizeDateToTimezone(newDueDate);
  const currentDueDateNormalized = normalizeDateToTimezone(existing.dueDate);

  if (newDueDateNormalized <= currentDueDateNormalized) {
    throw new Error('New due date must be after the current due date.');
  }

  const dueDateStr = newDueDate.toLocaleDateString('en-CA', {
    timeZone: process.env.APP_TIMEZONE ?? 'Asia/Dhaka'
  });
  const extensionNote = `Extended to ${dueDateStr}: ${reason.trim()}`;
  const newNotes = [existing.notes, extensionNote].filter(Boolean).join('\n');

  const updatedLoan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      dueDate: newDueDate,
      notes: newNotes
    },
    include: {
      equipment: true,
      member: true,
      issuedBy: { select: { id: true, name: true, email: true } }
    }
  });

  return updatedLoan;
}

export async function markLost(input: {
  loanId: string;
  markedByUserId: string;
  notes?: string;
}): Promise<object> {
  const { loanId, markedByUserId, notes } = input;

  const existing = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { equipment: true }
  });

  if (!existing) {
    throw new Error('Loan not found.');
  }
  if (existing.returnedAt !== null) {
    throw new Error('This loan is already closed.');
  }

  const updatedLoan = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const lostNote = notes?.trim() ? `Marked lost: ${notes.trim()}` : 'Marked as lost.';
    const newNotes = [existing.notes, lostNote].filter(Boolean).join('\n');

    const loan = await tx.loan.update({
      where: { id: loanId },
      data: {
        returnedAt: now,
        returnedToUserId: markedByUserId,
        returnCondition: 'LOST',
        notes: newNotes
      },
      include: {
        equipment: true,
        member: true,
        issuedBy: { select: { id: true, name: true, email: true } }
      }
    });

    await tx.equipment.update({
      where: { id: existing.equipmentId },
      data: { status: 'LOST' }
    });

    return loan;
  });

  return updatedLoan;
}
