import { z } from 'zod';

const conditionEnum = z.enum(['GOOD', 'FAIR', 'DAMAGED'] as const);

const statusEnum = z.enum(['AVAILABLE', 'BORROWED', 'DAMAGED', 'LOST', 'RETIRED'] as const);

export const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200, 'Name is too long.'),
  categoryId: z.string().min(1, 'Category is required.'),
  description: z.string().max(1000, 'Description is too long.').optional(),
  serialNumber: z.string().max(100, 'Serial number is too long.').optional(),
  condition: conditionEnum.optional().default('GOOD'),
  status: statusEnum.optional().default('AVAILABLE'),
  storageLocation: z
    .string()
    .min(1, 'Storage location is required.')
    .max(200, 'Storage location is too long.'),
  purchaseDate: z.coerce.date().optional()
});

export type CreateEquipmentData = z.infer<typeof createEquipmentSchema>;

export const bulkCreateEquipmentSchema = createEquipmentSchema.extend({
  quantity: z
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(100, 'Quantity cannot exceed 100.')
});

export type BulkCreateEquipmentData = z.infer<typeof bulkCreateEquipmentSchema>;

export const updateEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(200, 'Name is too long.').optional(),
  categoryId: z.string().min(1, 'Category is required.').optional(),
  description: z.string().max(1000, 'Description is too long.').optional(),
  serialNumber: z.string().max(100, 'Serial number is too long.').optional(),
  condition: conditionEnum.optional(),
  status: statusEnum.optional(),
  storageLocation: z
    .string()
    .min(1, 'Storage location is required.')
    .max(200, 'Storage location is too long.')
    .optional(),
  purchaseDate: z.coerce.date().optional(),
  notes: z.string().max(1000, 'Notes are too long.').optional()
});

export type UpdateEquipmentData = z.infer<typeof updateEquipmentSchema>;
