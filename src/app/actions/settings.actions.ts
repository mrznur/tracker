'use server';

import { changePasswordSchema } from '@/lib/schemas/auth';
import { changePassword } from '@/server/services/user.service';
import { auth } from '@/server/auth';

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function changePasswordAction(formData: FormData): Promise<ActionResult<void>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };

  const raw = Object.fromEntries(formData.entries());
  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }

  try {
    await changePassword(session.user.id, parsed.data.currentPassword, parsed.data.newPassword);
    return { success: true, data: undefined };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
