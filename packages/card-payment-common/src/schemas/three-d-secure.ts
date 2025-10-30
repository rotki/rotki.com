import { z } from 'zod';

/**
 * 3D Secure verification parameters schema
 */
export const ThreeDSecureParamsSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  bin: z.string().min(4, 'BIN must be at least 4 characters'),
  nonce: z.string().min(1, 'Nonce is required'),
  paymentMethodId: z.string().optional(),
  planId: z.number().int().positive('Plan ID must be positive'),
  token: z.string().min(1, 'Token is required'),
  discountCode: z.string().optional(),
});

export type ThreeDSecureParams = z.infer<typeof ThreeDSecureParamsSchema>;

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
