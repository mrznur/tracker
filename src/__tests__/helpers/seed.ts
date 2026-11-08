/**
 * Minimal seed helpers for tests.
 * Each helper creates the minimum records needed for a test scenario.
 */
import { prisma } from '@/server/db';

export async function seedCategory(overrides?: Partial<{ name: string; description: string }>) {
  return prisma.category.create({
    data: {
      name: overrides?.name ?? `Category-${Date.now()}`,
      description: overrides?.description ?? null
    }
  });
}

export async function seedEquipment(
  categoryId: string,
  overrides?: Partial<{
    assetTag: string;
    name: string;
    status: string;
    condition: string;
    storageLocation: string;
  }>
) {
  // Use a unique tag if not provided
  const tag = overrides?.assetTag ?? `TST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return prisma.equipment.create({
    data: {
      assetTag: tag,
      name: overrides?.name ?? 'Test Equipment',
      categoryId,
      status: overrides?.status ?? 'AVAILABLE',
      condition: overrides?.condition ?? 'GOOD',
      storageLocation: overrides?.storageLocation ?? 'Shelf A'
    }
  });
}

export async function seedMember(
  overrides?: Partial<{
    studentId: string;
    fullName: string;
    status: string;
    email: string;
    phone: string;
  }>
) {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).slice(2, 6);
  return prisma.member.create({
    data: {
      studentId: overrides?.studentId ?? `STU${ts}${rand}`,
      fullName: overrides?.fullName ?? 'Test Member',
      email: overrides?.email ?? `member${ts}${rand}@test.local`,
      phone: overrides?.phone ?? '01700000000',
      status: overrides?.status ?? 'ACTIVE'
    }
  });
}

export async function seedUser(
  overrides?: Partial<{
    name: string;
    email: string;
    passwordHash: string;
    role: string;
    isActive: boolean;
  }>
) {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).slice(2, 6);
  return prisma.user.create({
    data: {
      name: overrides?.name ?? 'Test User',
      email: overrides?.email ?? `user${ts}${rand}@test.local`,
      passwordHash: overrides?.passwordHash ?? '$2b$12$placeholder_hash_for_tests',
      role: overrides?.role ?? 'LAB_ASSISTANT',
      isActive: overrides?.isActive ?? true
    }
  });
}
