import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { monthsToPlanDuration, SigilEvents } from '@rotki/sigil';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { type PaymentReceipt, storePaymentReceipt } from '~/modules/checkout/utils/payment-receipt';

export type PurchaseDiscount = 'discount' | 'referral';

export interface CompletedPurchase {
  method: PaymentReceipt['method'];
  plan: { planId: number; name?: string; durationInMonths: number };
  /** EUR amount paid today, e.g. "22.50". */
  paid?: string;
  /** EUR price of each following period. */
  renewingPrice?: string;
  upgrade: boolean;
  renewal?: boolean;
  discount?: PurchaseDiscount;
}

interface UseCompletePurchaseReturn {
  completePurchase: (purchase: CompletedPurchase) => void;
}

/** The kind of discount a breakdown applied, for the purchase analytics. */
export function purchaseDiscount(discount: PaymentBreakdownResponse['discount'] | undefined): PurchaseDiscount | undefined {
  if (discount?.isValid !== true)
    return undefined;
  return discount.isReferral ? 'referral' : 'discount';
}

/**
 * Records a finished purchase: the purchase event for analytics and the receipt the success
 * page shows. The caller then opens the success page.
 */
export function useCompletePurchase(): UseCompletePurchaseReturn {
  const { chronicle } = useSigilEvents();

  function completePurchase({ method, plan, paid, renewingPrice, upgrade, renewal, discount }: CompletedPurchase): void {
    chronicle(SigilEvents.PURCHASE_SUCCESS, {
      paymentMethod: method,
      planId: plan.planId,
      planName: plan.name,
      planDuration: monthsToPlanDuration(plan.durationInMonths),
      revenue: paid ? Number.parseFloat(paid) : undefined,
      currency: 'EUR',
      isUpgrade: upgrade,
      discount,
    });
    storePaymentReceipt({
      method,
      planName: plan.name,
      durationInMonths: plan.durationInMonths,
      paid,
      renewingPrice,
      upgrade,
      renewal,
    });
  }

  return { completePurchase };
}
