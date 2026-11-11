import { prisma } from '@/server/db';

export type CreateEquipmentInput = {
  name: string;
  categoryId: string;
  description?: string;
  serialNumber?: string;
  condition?: 'GOOD' | 'FAIR' | 'DAMAGED';
  status?: 'AVAILABLE' | 'BORROWED' | 'DAMAGED' | 'LOST' | 'RETIRED';
  storageLocation: string;
  purchaseDate?: Date;
};

export type UpdateEquipmentInput = Partial<{
  name: string;
  categoryId: string;
  description: string;
  serialNumber: string;
  condition: 'GOOD' | 'FAIR' | 'DAMAGED';
  status: 'AVAILABLE' | 'BORROWED' | 'DAMAGED' | 'LOST' | 'RETIRED';
  storageLocation: string;
  purchaseDate: Date;
  notes: string;
}>;

export async function getEquipmentList(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  condition?: string;
} = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [
      { name: { contains: term } },
      { assetTag: { contains: term } },
      { serialNumber: { contains: term } }
    ];
  }

  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.status) where.status = params.status;
  if (params.condition) where.condition = params.condition;

  const [items, total] = await prisma.$transaction([
    prisma.equipment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { assetTag: 'asc' },
      include: {
        category: true,
        loans: {
          where: { returnedAt: null },
          include: { member: { select: { id: true, fullName: true, studentId: true } } },
          take: 1
        }
      }
    }),
    prisma.equipment.count({ where })
  ]);

  return { items, total, page, pageSize };
}

export async function getEquipmentById(id: string) {
  const equipment = await prisma.equipment.findUnique({
    where: { id },
    include: {
      category: true,
      loans: {
        where: { returnedAt: null },
        include: {
          member: { select: { id: true, fullName: true, studentId: true, email: true } },
          issuedBy: { select: { id: true, name: true } }
        },
        take: 1
      }
    }
  });

  if (!equipment) return null;

  const loanHistory = await prisma.loan.findMany({
    where: { equipmentId: id },
    orderBy: { borrowedAt: 'desc' },
    include: {
      member: { select: { id: true, fullName: true, studentId: true } },
      issuedBy: { select: { id: true, name: true } },
      returnedTo: { select: { id: true, name: true } }
    }
  });

  return { ...equipment, loanHistory };
}

// Finds the next available RC-XXXX asset tag inside a transaction
async function getNextAssetTag(): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.equipment.findFirst({
      where: { assetTag: { startsWith: 'RC-' } },
      orderBy: { assetTag: 'desc' },
      select: { assetTag: true }
    });

    let nextNum = 1;
    if (latest) {
      const match = /^RC-(\d+)$/.exec(latest.assetTag);
      if (match?.[1]) nextNum = parseInt(match[1], 10) + 1;
    }

    return `RC-${String(nextNum).padStart(4, '0')}`;
  });
}

export async function createEquipment(input: CreateEquipmentInput) {
  const assetTag = await getNextAssetTag();

  return prisma.equipment.create({
    data: {
      assetTag,
      name: input.name.trim(),
      categoryId: input.categoryId,
      description: input.description?.trim() ?? null,
      serialNumber: input.serialNumber?.trim() ?? null,
      condition: input.condition ?? 'GOOD',
      status: input.status ?? 'AVAILABLE',
      storageLocation: input.storageLocation.trim(),
      purchaseDate: input.purchaseDate ?? null
    },
    include: { category: true }
  });
}

export async function bulkCreateEquipment(input: CreateEquipmentInput & { quantity: number }) {
  const { quantity, ...common } = input;

  if (quantity < 1 || quantity > 100) {
    throw new Error('Quantity must be between 1 and 100.');
  }

  const created: Awaited<ReturnType<typeof prisma.equipment.create>>[] = [];

  // All tags generated sequentially in one transaction — no duplicate tags possible
  await prisma.$transaction(async (tx) => {
    const latest = await tx.equipment.findFirst({
      where: { assetTag: { startsWith: 'RC-' } },
      orderBy: { assetTag: 'desc' },
      select: { assetTag: true }
    });

    let nextNum = 1;
    if (latest) {
      const match = /^RC-(\d+)$/.exec(latest.assetTag);
      if (match?.[1]) nextNum = parseInt(match[1], 10) + 1;
    }

    for (let i = 0; i < quantity; i++) {
      const assetTag = `RC-${String(nextNum + i).padStart(4, '0')}`;
      const item = await tx.equipment.create({
        data: {
          assetTag,
          name: common.name.trim(),
          categoryId: common.categoryId,
          description: common.description?.trim() ?? null,
          serialNumber: common.serialNumber?.trim() ?? null,
          condition: common.condition ?? 'GOOD',
          status: 'AVAILABLE',
          storageLocation: common.storageLocation.trim(),
          purchaseDate: common.purchaseDate ?? null
        },
        include: { category: true }
      });
      created.push(item);
    }
  });

  return created;
}

export async function updateEquipment(id: string, input: UpdateEquipmentInput) {
  const existing = await prisma.equipment.findUnique({ where: { id } });
  if (!existing) throw new Error('Equipment not found.');

  if (existing.status === 'RETIRED' && input.status === 'BORROWED') {
    throw new Error('Retired items cannot be set to borrowed status.');
  }

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.description !== undefined) data.description = input.description.trim();
  if (input.serialNumber !== undefined) data.serialNumber = input.serialNumber.trim();
  if (input.condition !== undefined) data.condition = input.condition;
  if (input.storageLocation !== undefined) data.storageLocation = input.storageLocation.trim();
  if (input.purchaseDate !== undefined) data.purchaseDate = input.purchaseDate;
  if (input.status !== undefined) data.status = input.status;

  return prisma.equipment.update({
    where: { id },
    data,
    include: { category: true }
  });
}
