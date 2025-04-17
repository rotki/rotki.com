import { z } from 'zod';

export enum PaymentMethod {
  BLOCKCHAIN = 1,
  CARD = 2,
  PAYPAL = 3,
}

export enum DiscountType {
  FIXED = 'Fixed Amount',
  PERCENTAGE = 'Percentage',
}

export const ValidDiscountInfo = z.object({
  discountAmount: z.number(),
  discountedAmount: z.number(),
  discountType: z.nativeEnum(DiscountType),
  finalPrice: z.number(),
  isValid: z.literal(true),
});

export const InvalidDiscountInfo = z.object({
  error: z.string(),
  isValid: z.literal(false),
});

export const DiscountInfo = z.discriminatedUnion('isValid', [ValidDiscountInfo, InvalidDiscountInfo]);

export type DiscountInfo = z.infer<typeof DiscountInfo>;
