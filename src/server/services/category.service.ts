import { prisma } from '@/server/db';

export type CreateCategoryInput = {
  name: string;
  description?: string;
};

export type UpdateCategoryInput = Partial<{
  name: string;
  description: string;
}>;

export async function listCategories(): Promise<object[]> {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { equipment: true } }
    }
  });
  return categories;
}

export async function createCategory(input: CreateCategoryInput): Promise<object> {
  const existing = await prisma.category.findUnique({
    where: { name: input.name.trim() }
  });
  if (existing) {
    throw new Error(`A category named "${input.name}" already exists.`);
  }

  const category = await prisma.category.create({
    data: {
      name: input.name.trim(),
      description: input.description?.trim() ?? null
    }
  });

  return category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<object> {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Category not found.');
  }

  if (input.name && input.name.trim() !== existing.name) {
    const conflict = await prisma.category.findUnique({
      where: { name: input.name.trim() }
    });
    if (conflict) {
      throw new Error(`A category named "${input.name}" already exists.`);
    }
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description.trim();

  const updated = await prisma.category.update({ where: { id }, data });
  return updated;
}

export async function deleteCategory(id: string): Promise<void> {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { equipment: true } } }
  });
  if (!existing) {
    throw new Error('Category not found.');
  }

  if (existing._count.equipment > 0) {
    throw new Error(
      `Cannot delete this category — it has ${existing._count.equipment} equipment item(s) assigned to it.`
    );
  }

  await prisma.category.delete({ where: { id } });
}
