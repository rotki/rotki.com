import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { buildOrderSummary, type OrderSummary } from '@rotki/card-payment-common/utils/order-summary';
import { get } from '@vueuse/shared';
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue';
import { useCheckoutMessages } from './checkout-messages';

export interface OrderTotalsInput {
  /** The plan being bought; the totals are empty until it is known. */
  plan: MaybeRefOrGetter<Pick<SelectedPlan, 'price' | 'durationInMonths'> | undefined>;
  breakdown: MaybeRefOrGetter<PaymentBreakdownResponse | undefined>;
  upgrade?: MaybeRefOrGetter<boolean>;
}

export interface UseOrderTotalsReturn {
  summary: ComputedRef<OrderSummary | undefined>;
  /** The amount due today, formatted. */
  total: ComputedRef<string | undefined>;
  /** What each later period costs, for the line under the total on the phone summary bar. */
  totalNote: ComputedRef<string | undefined>;
}

/** The order summary of a payment page, with the amount due and the renewal line under it. */
export function useOrderTotals({ plan, breakdown, upgrade = false }: OrderTotalsInput): UseOrderTotalsReturn {
  const t = useCheckoutMessages();

  const summary = computed<OrderSummary | undefined>(() => {
    const selected = toValue(plan);
    return selected ? buildOrderSummary({ plan: selected, breakdown: toValue(breakdown), upgrade: toValue(upgrade) }) : undefined;
  });

  const total = computed<string | undefined>(() => get(summary)?.dueToday.formatted);

  const totalNote = computed<string | undefined>(() => {
    const info = get(summary);
    const selected = toValue(plan);
    if (!info || !selected)
      return undefined;
    const amount = info.renewal.formatted;
    return selected.durationInMonths === 12 ? t('checkout.page.then_year', { amount }) : t('checkout.page.then_month', { amount });
  });

  return { summary, total, totalNote };
}
