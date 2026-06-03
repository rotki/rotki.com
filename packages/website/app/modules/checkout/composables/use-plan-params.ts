import { get } from '@vueuse/shared';
import { useReferralTracking } from '~/composables/chronicling/use-referral-tracking';

type CurrencyParam = string | null;

type DiscountCodeParam = string | undefined;

export function usePlanIdParam(): { planId: ComputedRef<number | undefined> } {
  const route = useRoute();
  const planId = computed<number | undefined>(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { planId } = route.query;
    if (!planId)
      return undefined;

    return typeof planId === 'string' ? parseInt(planId) : undefined;
  });

  return { planId };
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

export function useDiscountCodeParams() {
  const route = useRoute();
  const discountCode = computed<DiscountCodeParam>(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { discountCode } = route.query;
    if (typeof discountCode !== 'string' || !discountCode)
      return undefined;

    return discountCode;
  });

  return { discountCode };
}

type ReferralCodeParam = string | undefined;

export function useReferralCodeParam() {
  const route = useRoute();
  const { referralCode: storedReferralCode } = useReferralTracking();
  const referralCode = computed<ReferralCodeParam>(() => {
    const { ref } = route.query;
    if (typeof ref === 'string' && ref)
      return ref;

    // Fall back to the persisted cookie when the query param was stripped by
    // navigation (top nav, logo, footer, valid-plan-id redirect).
    return get(storedReferralCode) || undefined;
  });

  return { referralCode };
}

export function useSubscriptionIdParam() {
  const route = useRoute();
  const subscriptionId = computed<string | undefined>(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const query = get(route).query;
    return typeof query.id === 'string' ? query.id : undefined;
  });

  const upgradeSubId = computed<string | undefined>(() => {
    const query = get(route).query;
    return typeof query.upgradeSubId === 'string' ? query.upgradeSubId : undefined;
  });
  return { subscriptionId, upgradeSubId };
}
