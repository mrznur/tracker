import { prisma } from '@/server/db';
import bcrypt from 'bcryptjs';

// The shape of a user row returned from this service
export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'LAB_ASSISTANT' | 'EXECUTIVE';
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true
} as const;

export async function listUsers(): Promise<UserRow[]> {
  return prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: userSelect
  });
}

export async function createUser(input: CreateUserInput): Promise<UserRow> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.trim() } });
  if (existing) {
    throw new Error(`A user with email "${input.email}" already exists.`);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: input.role,
      isActive: true
    },
    select: userSelect
  });
}

export async function deactivateUser(id: string): Promise<UserRow> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error('User not found.');

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: userSelect
  });
}

export async function activateUser(id: string): Promise<UserRow> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error('User not found.');

  return prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: userSelect
  });
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error('User not found.');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found.');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error('Current password is incorrect.');

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}

export async function changeRole(
  id: string,
  role: 'ADMIN' | 'LAB_ASSISTANT' | 'EXECUTIVE'
): Promise<UserRow> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) throw new Error('User not found.');

  return prisma.user.update({
    where: { id },
    data: { role },
    select: userSelect
  });
}
