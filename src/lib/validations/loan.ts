import { z } from 'zod';

export const createLoanSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required.'),
  memberId: z.string().min(1, 'Member is required.'),
  issuedByUserId: z.string().min(1, 'Issuing user is required.'),
  dueDate: z.coerce.date().optional(),
  purpose: z.string().min(1, 'Purpose is required.').max(500, 'Purpose is too long.'),
  notes: z.string().max(1000, 'Notes are too long.').optional()
});

export type CreateLoanData = z.infer<typeof createLoanSchema>;

export const returnLoanSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required.'),
  returnedToUserId: z.string().min(1, 'Receiving user is required.'),
  returnCondition: z.enum(['GOOD', 'FAIR', 'DAMAGED', 'LOST'] as const, {
    error: 'Return condition is required and must be GOOD, FAIR, DAMAGED, or LOST.'
  }),
  notes: z.string().max(1000, 'Notes are too long.').optional()
});

export type ReturnLoanData = z.infer<typeof returnLoanSchema>;

export const extendLoanSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required.'),
  newDueDate: z.coerce.date(),
  reason: z.string().min(1, 'Reason is required.').max(500, 'Reason is too long.')
});

export type ExtendLoanData = z.infer<typeof extendLoanSchema>;

export const markLostSchema = z.object({
  loanId: z.string().min(1, 'Loan ID is required.'),
  markedByUserId: z.string().min(1, 'User ID is required.'),
  notes: z.string().max(1000, 'Notes are too long.').optional()
});

export type MarkLostData = z.infer<typeof markLostSchema>;
