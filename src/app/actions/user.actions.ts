'use server';

import { z } from 'zod';
import {
  createUser,
  deactivateUser,
  resetPassword,
  changeRole
} from '@/server/services/user.service';
import { prisma } from '@/server/db';
import { auth } from '@/server/auth';

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['ADMIN', 'LAB_ASSISTANT', 'EXECUTIVE'])
});

const ChangeRoleSchema = z.object({
  role: z.enum(['ADMIN', 'LAB_ASSISTANT', 'EXECUTIVE'])
});

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function createUserAction(formData: FormData): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await createUser(parsed.data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function deactivateUserAction(id: string): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  try {
    const data = await deactivateUser(id);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function activateUserAction(id: string): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  try {
    const data = await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true }
    });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function resetPasswordAction(
  id: string,
  newPassword: string
): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  try {
    await resetPassword(id, newPassword);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function changeRoleAction(
  id: string,
  formData: FormData
): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role !== 'ADMIN') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = ChangeRoleSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await changeRole(id, parsed.data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
