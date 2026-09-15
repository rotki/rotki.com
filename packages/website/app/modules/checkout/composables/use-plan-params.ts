import { get } from '@vueuse/shared';
import { useReferralTracking } from '~/composables/chronicling/use-referral-tracking';
import { nonEmpty } from '~/utils/non-empty';

type CurrencyParam = string | null;

type DiscountCodeParam = string | undefined;

/**
 * Reads the `planId` query param.
 *
 * NB: backend email links also use this param name. If it changes, sync with the
 * backend team so they update the email links.
 */
export function usePlanIdParam(): { planId: ComputedRef<number | undefined> } {
  const route = useRoute();
  const planId = computed<number | undefined>(() => {
    const { planId } = route.query;
    if (!planId)
      return undefined;

    return typeof planId === 'string' ? parseInt(planId) : undefined;
  });

  return { planId };
}

/**
 * Reads the `currency` query param.
 *
 * NB: backend email links also use this param name. If it changes, sync with the
 * backend team so they update the email links.
 */
export function useCurrencyParams() {
  const route = useRoute();
  const currency = computed<CurrencyParam>(() => {
    const { currency } = route.query;
    if (typeof currency !== 'string')
      return null;

    return currency;
  });

  return { currency };
}

/**
 * Reads the `discountCode` query param.
 *
 * NB: backend email links also use this param name. If it changes, sync with the
 * backend team so they update the email links.
 */
export function useDiscountCodeParams() {
  const route = useRoute();
  const discountCode = computed<DiscountCodeParam>(() => {
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

    // Fall back to the persisted cookie when navigation stripped the query param.
    return nonEmpty(get(storedReferralCode));
  });

  return { referralCode };
}

/**
 * Reads the `id` (subscription) and `upgradeSubId` query params.
 *
 * NB: backend email links also use the `id` param name. If it changes, sync with
 * the backend team so they update the email links.
 */
export function useSubscriptionIdParam() {
  const route = useRoute();
  const subscriptionId = computed<string | undefined>(() => {
    const query = get(route).query;
    return typeof query.id === 'string' ? query.id : undefined;
  });

  const upgradeSubId = computed<string | undefined>(() => {
    const query = get(route).query;
    return typeof query.upgradeSubId === 'string' ? query.upgradeSubId : undefined;
  });
  return { subscriptionId, upgradeSubId };
}
