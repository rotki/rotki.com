import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { z } from 'zod';
import { PAYMENT_COMPLETED_KEY } from '~/modules/checkout/constants';

export const PaymentReceiptSchema = z.object({
  method: z.enum(['card', 'paypal', 'crypto']),
  planName: z.string().optional(),
  durationInMonths: z.number().int().positive(),
  /** EUR amount paid today, e.g. "22.50". */
  paid: z.string().optional(),
  /** EUR price of each following period. */
  renewingPrice: z.string().optional(),
  upgrade: z.boolean(),
});

export type PaymentReceipt = z.infer<typeof PaymentReceiptSchema>;

/** The receipt for a plan paid at its breakdown's price. */
export function buildPaymentReceipt(
  method: PaymentReceipt['method'],
  plan: Pick<SelectedPlan, 'name' | 'durationInMonths'>,
  breakdown: Pick<PaymentBreakdownResponse, 'finalAmount' | 'renewingPrice'> | undefined,
  upgrade: boolean,
): PaymentReceipt {
  return {
    method,
    planName: plan.name,
    durationInMonths: plan.durationInMonths,
    paid: breakdown?.finalAmount,
    renewingPrice: breakdown?.renewingPrice,
    upgrade,
  };
}

/** Lets the success page open once, showing this receipt. */
export function storePaymentReceipt(receipt: PaymentReceipt): void {
  sessionStorage.setItem(PAYMENT_COMPLETED_KEY, JSON.stringify(receipt));
}

/** The receipt of the payment just made, removed so a reload does not show it again. */
export function takePaymentReceipt(): PaymentReceipt | undefined {
  const stored = sessionStorage.getItem(PAYMENT_COMPLETED_KEY);
  sessionStorage.removeItem(PAYMENT_COMPLETED_KEY);
  if (!stored)
    return undefined;
  try {
    const result = PaymentReceiptSchema.safeParse(JSON.parse(stored));
    return result.success ? result.data : undefined;
  }
  catch {
    return undefined;
  }
}
