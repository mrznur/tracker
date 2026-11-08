'use server';

import { z } from 'zod';
import {
  createEquipment,
  updateEquipment,
  bulkCreateEquipment
} from '@/server/services/equipment.service';
import { auth } from '@/server/auth';
import { prisma } from '@/server/db';

const CreateEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(['GOOD', 'FAIR', 'DAMAGED']).default('GOOD'),
  status: z.enum(['AVAILABLE', 'BORROWED', 'DAMAGED', 'LOST', 'RETIRED']).default('AVAILABLE'),
  storageLocation: z.string().min(1, 'Storage location is required'),
  purchaseDate: z.coerce.date().optional()
});

const UpdateEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  serialNumber: z.string().optional(),
  condition: z.enum(['GOOD', 'FAIR', 'DAMAGED']).optional(),
  status: z.enum(['AVAILABLE', 'BORROWED', 'DAMAGED', 'LOST', 'RETIRED']).optional(),
  storageLocation: z.string().optional(),
  purchaseDate: z.coerce.date().optional(),
  notes: z.string().optional()
});

const BulkCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  storageLocation: z.string().min(1, 'Storage location is required'),
  condition: z.enum(['GOOD', 'FAIR', 'DAMAGED']).default('GOOD'),
  quantity: z.coerce.number().int().min(1).max(100)
});

type ActionResult<T = unknown> = { success: true; data: T } | { success: false; error: string };

export async function createEquipmentAction(formData: FormData): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = CreateEquipmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await createEquipment(parsed.data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function updateEquipmentAction(
  id: string,
  formData: FormData
): Promise<ActionResult<object>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = UpdateEquipmentSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await updateEquipment(id, parsed.data);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function bulkCreateEquipmentAction(
  formData: FormData
): Promise<ActionResult<object[]>> {
  const session = await auth();
  if (!session) return { success: false, error: 'Unauthorized' };
  if (session.user.role === 'EXECUTIVE') {
    return { success: false, error: 'You do not have permission to perform this action.' };
  }

  const raw = Object.fromEntries(formData.entries());
  const parsed = BulkCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues.map((e) => e.message).join(', ') };
  }
  try {
    const data = await bulkCreateEquipment({
      ...parsed.data,
      status: 'AVAILABLE'
    });
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function lookupEquipmentByTagAction(tag: string): Promise<{
  found: boolean;
  available: boolean;
  name: string;
  assetTag: string;
  id: string;
  borrowerName?: string;
}> {
  const item = await prisma.equipment.findUnique({
    where: { assetTag: tag },
    include: {
      loans: {
        where: { returnedAt: null },
        include: { member: { select: { fullName: true } } },
        take: 1
      }
    }
  });

  if (!item) {
    return { found: false, available: false, name: '', assetTag: tag, id: '' };
  }

  const activeLoan = item.loans[0];
  const available = item.status === 'AVAILABLE';

  return {
    found: true,
    available,
    name: item.name,
    assetTag: item.assetTag,
    id: item.id,
    borrowerName: activeLoan?.member?.fullName
  };
}
