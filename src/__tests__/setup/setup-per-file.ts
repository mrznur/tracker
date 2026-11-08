/**
 * Runs before each test file.
 * Clears all rows in a safe order (children before parents) so every test
 * file starts with an empty database.
 */
import { afterAll, beforeAll } from 'vitest';
import { prisma } from '@/server/db';

beforeAll(async () => {
  await prisma.loan.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.member.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
