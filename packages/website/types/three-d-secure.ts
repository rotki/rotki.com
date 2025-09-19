import { z } from 'zod';

/**
 * 3D Secure verification parameters schema
 */
export const ThreeDSecureParamsSchema = z.object({
  /**
   * Payment amount for verification
   */
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  /**
   * Card BIN for 3D Secure verification
   */
  bin: z.string().min(4, 'BIN must be at least 4 characters'),
  /**
   * Payment method nonce from Braintree
   */
  nonce: z.string().min(1, 'Nonce is required'),
  /**
   * Optional payment method ID for navigation persistence
   */
  paymentMethodId: z.string().optional(),
  /**
   * Selected plan duration in months
   */
  planMonths: z.coerce.number().int().positive('Plan months must be positive'),
  /**
   * Braintree client authorization token
   */
  token: z.string().min(1, 'Token is required'),
});

export type ThreeDSecureParams = z.infer<typeof ThreeDSecureParamsSchema>;

/**
 * 3D Secure result schema for session storage
 */
export const ThreeDSecureResultSchema = z.object({
  /**
   * Error message (only present on failure)
   */
  error: z.string().optional(),
  /**
   * Verified nonce (only present on success)
   */
  nonce: z.string().optional(),
  /**
   * Payment method ID for navigation
   */
  paymentMethodId: z.string().optional(),
  /**
   * Plan months for payment continuation
   */
  planMonths: z.number(),
  /**
   * Whether verification was successful
   */
  success: z.boolean(),
});

export type ThreeDSecureResult = z.infer<typeof ThreeDSecureResultSchema>;

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
