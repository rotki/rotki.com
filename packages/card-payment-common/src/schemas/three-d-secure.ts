import { z } from 'zod';

export const DiscountTrackingInfoSchema = z.object({
  isReferral: z.boolean(),
  discountType: z.string(),
});

export type DiscountTrackingInfo = z.infer<typeof DiscountTrackingInfoSchema>;

/**
 * 3D Secure verification parameters schema
 */
export const ThreeDSecureParamsSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  finalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  renewingPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  bin: z.string().min(4, 'BIN must be at least 4 characters'),
  nonce: z.string().min(1, 'Nonce is required'),
  paymentMethodId: z.string().optional(),
  planId: z.number().int().positive('Plan ID must be positive'),
  token: z.string().min(1, 'Token is required'),
  discountCode: z.string().optional(),
  upgradeSubId: z.string().optional(),
  durationInMonths: z.number().int().positive('duration must be positive'),
  planName: z.string().optional(),
  discountTrackingInfo: DiscountTrackingInfoSchema.optional(),
});

export type ThreeDSecureParams = z.infer<typeof ThreeDSecureParamsSchema>;

export interface PaymentInfo {
  amount: string;
  finalAmount: string;
  durationInMonths: string;
  renewingPrice: string;
}

/**
 * 3D Secure verification state
 */
export type ThreeDSecureState =
  | 'initializing'
  | 'ready'
  | 'verifying'
  | 'challenge-active'
  | 'success'
  | 'error';
