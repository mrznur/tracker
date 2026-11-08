import { z } from 'zod';

export const createMemberSchema = z.object({
  studentId: z
    .string()
    .min(1, 'Student ID is required.')
    .max(50, 'Student ID is too long.')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Student ID may only contain letters, numbers, hyphens, and underscores.'
    ),
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(200, 'Name is too long.'),
  email: z.string().email('Invalid email address.').max(255, 'Email is too long.'),
  phone: z.string().min(1, 'Phone number is required.').max(30, 'Phone number is too long.'),
  department: z.string().max(200, 'Department name is too long.').optional(),
  notes: z.string().max(1000, 'Notes are too long.').optional()
});

export type CreateMemberData = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters.')
    .max(200, 'Name is too long.')
    .optional(),
  email: z.string().email('Invalid email address.').max(255, 'Email is too long.').optional(),
  phone: z
    .string()
    .min(1, 'Phone number is required.')
    .max(30, 'Phone number is too long.')
    .optional(),
  department: z.string().max(200, 'Department name is too long.').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE'] as const).optional(),
  notes: z.string().max(1000, 'Notes are too long.').optional()
});

export type UpdateMemberData = z.infer<typeof updateMemberSchema>;
