import { z } from 'zod';

export enum DiscountType {
  FIXED = 'Fixed Amount',
  PERCENTAGE = 'Percentage',
}

export const ValidDiscountInfoSchema = z.object({
  discountAmount: z.number(),
  discountedAmount: z.number(),
  discountType: z.nativeEnum(DiscountType),
  finalPrice: z.number(),
  isValid: z.literal(true),
});

export const InvalidDiscountInfoSchema = z.object({
  error: z.string(),
  isValid: z.literal(false),
});

export const DiscountInfoSchema = z.discriminatedUnion('isValid', [ValidDiscountInfoSchema, InvalidDiscountInfoSchema]);

export type ValidDiscountInfo = z.infer<typeof ValidDiscountInfoSchema>;

export type InvalidDiscountInfo = z.infer<typeof InvalidDiscountInfoSchema>;

export type DiscountInfo = z.infer<typeof DiscountInfoSchema>;
