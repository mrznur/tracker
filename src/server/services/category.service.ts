import { prisma } from '@/server/db';

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  _count: { equipment: number };
};

export async function listCategories(): Promise<CategoryRow[]> {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { equipment: true } } }
  });
}

export async function createCategory(input: {
  name: string;
  description?: string;
}): Promise<{ id: string; name: string; description: string | null }> {
  const existing = await prisma.category.findUnique({ where: { name: input.name.trim() } });
  if (existing) throw new Error(`A category named "${input.name}" already exists.`);

  return prisma.category.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() ?? null
    }
  });
}
