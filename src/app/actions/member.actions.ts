'use server';

import { z } from 'zod';
import { createMember, updateMember } from '@/server/services/member.service';
import { auth } from '@/server/auth';

const CreateMemberSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(1, 'Phone is required'),
  department: z.string().optional(),
  notes: z.string().optional()
});

const UpdateMemberSchema = z.object({
  fullName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  notes: z.string().optional()
});

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function createMemberAction(formData: FormData): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await createMember(parsed.data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateMemberAction(
  id: string,
  formData: FormData
): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = UpdateMemberSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await updateMember(id, parsed.data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
