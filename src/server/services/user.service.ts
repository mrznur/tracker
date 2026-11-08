import { prisma } from '@/server/db';
import bcrypt from 'bcryptjs';

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'LAB_ASSISTANT' | 'EXECUTIVE';
};

export type UpdateUserRoleInput = {
  role: 'ADMIN' | 'LAB_ASSISTANT' | 'EXECUTIVE';
};

export async function listUsers(): Promise<object[]> {
  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
  return users;
}

export async function createUser(input: CreateUserInput): Promise<object> {
  const existing = await prisma.user.findUnique({ where: { email: input.email.trim() } });
  if (existing) {
    throw new Error(`A user with email "${input.email}" already exists.`);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash,
      role: input.role,
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  return user;
}

export async function deactivateUser(id: string): Promise<object> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('User not found.');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  return updated;
}

export async function resetPassword(id: string, newPassword: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('User not found.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash }
  });
}

export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new Error('User not found.');
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error('Current password is incorrect.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { passwordHash }
  });
}

export async function changeRole(id: string, input: UpdateUserRoleInput): Promise<object> {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('User not found.');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: input.role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  return updated;
}
