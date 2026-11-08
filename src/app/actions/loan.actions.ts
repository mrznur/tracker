'use server';

import { z } from 'zod';
import { createLoan, returnLoan, extendLoan, markLost } from '@/server/services/loan.service';
import { auth } from '@/server/auth';

const CreateLoanSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  memberId: z.string().min(1, 'Member is required'),
  dueDate: z.coerce.date().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  notes: z.string().optional()
});

const ReturnLoanSchema = z.object({
  loanId: z.string().min(1),
  returnCondition: z.enum(['GOOD', 'FAIR', 'DAMAGED', 'LOST']),
  notes: z.string().optional()
});

const ExtendLoanSchema = z.object({
  loanId: z.string().min(1),
  newDueDate: z.coerce.date(),
  reason: z.string().min(1, 'Reason is required')
});

const MarkLostSchema = z.object({
  loanId: z.string().min(1),
  notes: z.string().optional()
});

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function createLoanAction(formData: FormData): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateLoanSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const result = await createLoan({
      equipmentId: parsed.data.equipmentId,
      memberId: parsed.data.memberId,
      issuedByUserId: session.user.id,
      dueDate: parsed.data.dueDate,
      purpose: parsed.data.purpose,
      notes: parsed.data.notes
    });
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function returnLoanAction(formData: FormData): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = ReturnLoanSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await returnLoan({
      loanId: parsed.data.loanId,
      returnedToUserId: session.user.id,
      returnCondition: parsed.data.returnCondition,
      notes: parsed.data.notes
    });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function extendLoanAction(formData: FormData): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = ExtendLoanSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await extendLoan({
      loanId: parsed.data.loanId,
      newDueDate: parsed.data.newDueDate,
      reason: parsed.data.reason
    });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function markLostAction(formData: FormData): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = MarkLostSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await markLost({
      loanId: parsed.data.loanId,
      markedByUserId: session.user.id,
      notes: parsed.data.notes
    });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
