import type { PricingPeriod } from '~/types/tiers';
import { get } from '@vueuse/core';

type CurrencyParam = string | null;

export interface PlanParams {
  period: PricingPeriod;
  planId: number;
  plan: string;
}

export function usePlanParams(): { plan: ComputedRef<PlanParams | undefined> } {
  const route = useRoute();
  const plan = computed(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { period, plan, planId } = route.query;
    if (!period || !plan)
      return undefined;

    return {
      period: period as PricingPeriod,
      plan: plan as string,
      planId: parseInt(planId as string),
    };
  });

  return { plan };
}

export function useCurrencyParams() {
  const route = useRoute();
  const currency = computed<CurrencyParam>(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { currency } = route.query;
    if (typeof currency !== 'string')
      return null;

    return currency;
  });

  return { currency };
}

export function useSubscriptionIdParam() {
  const route = useRoute();
  const subscriptionId = computed(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const query = get(route).query;
    return typeof query.id === 'string' ? query.id : undefined;
  });
  return { subscriptionId };
}

export function usePaymentMethodParam() {
  const route = useRoute();
  const paymentMethodId = computed(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { method } = get(route).query;
    return typeof method === 'string' ? Number(method) : -1;
  });
  return { paymentMethodId };
}
