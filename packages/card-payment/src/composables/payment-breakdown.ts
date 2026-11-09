import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { set } from '@vueuse/core';
import { type MaybeRefOrGetter, type Ref, shallowReadonly, shallowRef, toValue, watch } from 'vue';
import { getPaymentBreakdown } from '@/utils/api';

export interface UsePaymentBreakdownReturn {
  breakdown: Readonly<Ref<PaymentBreakdownResponse | undefined>>;
  loading: Readonly<Ref<boolean>>;
}

/**
 * The payment breakdown for the plan and discount code, fetched again when either changes.
 * Requests run concurrently, so a response overtaken by a newer request is dropped: applying
 * it would price the order without the code and make the checkout clear a valid discount.
 *
 * @param plan - The plan being bought.
 * @param discountCode - The code to price the order with, if any.
 * @param initial - The breakdown the page loaded for the plan without a code. When no code
 * applies at the start it is used as is, so the page does not ask for it twice. A starting
 * code (referral, campaign) needs its own breakdown, since the code-less one would read as
 * a rejection.
 */
export function usePaymentBreakdown(
  plan: MaybeRefOrGetter<SelectedPlan>,
  discountCode: MaybeRefOrGetter<string | undefined>,
  initial?: PaymentBreakdownResponse,
): UsePaymentBreakdownReturn {
  const seed = toValue(discountCode) ? undefined : initial;
  const breakdown = shallowRef<PaymentBreakdownResponse | undefined>(seed);
  const loading = shallowRef<boolean>(false);

  let latestRequest = 0;

  async function load(): Promise<void> {
    const requestId = ++latestRequest;
    set(loading, true);
    const code = toValue(discountCode);
    const response = await getPaymentBreakdown({
      newPlanId: toValue(plan).planId,
      isCryptoPayment: false,
      ...(code ? { discountCode: code } : {}),
    });
    if (requestId !== latestRequest)
      return;

    // A failure drops the breakdown: the previous one may price another plan.
    set(breakdown, response.ok ? response.value : undefined);
    set(loading, false);
  }

  watch(() => toValue(plan).planId, async () => {
    await load();
  }, { immediate: !seed });

  watch(() => toValue(discountCode), async () => {
    await load();
  });

  return { breakdown: shallowReadonly(breakdown), loading: shallowReadonly(loading) };
}
