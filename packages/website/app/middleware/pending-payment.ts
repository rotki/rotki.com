import type { UserSubscriptions } from '@rotki/card-payment-common/schemas/subscription';
import type { RouteLocationRaw } from 'vue-router';
import { isSubRequestingUpgrade } from '@rotki/card-payment-common/utils/subscription';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { getPricingPeriod } from '~/components/pricings/utils';
import { useFetchUserSubscriptions } from '~/composables/subscription/use-fetch-user-subscriptions';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
import { useMainStore } from '~/store';
import { PricingPeriod } from '~/types/tiers';

type UserSubscription = UserSubscriptions[number];

type CryptoPaymentApi = ReturnType<typeof useCryptoPaymentApi>;

/** `done: false` means the upgrade has no pending payment and the regular pending payment check should run. */
type UpgradeCheck = { done: true; target?: RouteLocationRaw } | { done: false };

const SUBSCRIPTION_PATH = '/home/subscription';
const CRYPTO_CHECKOUT_PATH = '/checkout/pay/crypto';

/**
 * Checks the crypto payment of a subscription that requests an upgrade. Stops the
 * middleware without navigating when the check fails or the plan id is missing.
 */
async function checkUpgradePayment(pendingSub: UserSubscription, paymentApi: CryptoPaymentApi): Promise<UpgradeCheck> {
  const { durationInMonths, id, planId } = pendingSub;
  const response = await paymentApi.checkCryptoUpgradePayment(id);

  if (response.isError || !isDefined(planId))
    return { done: true };

  const { currency, pending, toPlan, transactionStarted } = response.result;

  if (transactionStarted)
    return { done: true, target: SUBSCRIPTION_PATH };

  if (!pending)
    return { done: false };

  const queryParams: {
    plan: string;
    currency: string;
    period: string;
    upgradeSubId: string;
    planId: number;
  } = {
    currency: currency ?? '',
    period: getPricingPeriod(durationInMonths),
    plan: toPlan.tier.name,
    planId: toPlan.id,
    upgradeSubId: id,
  };

  return { done: true, target: { path: CRYPTO_CHECKOUT_PATH, query: queryParams } };
}

/**
 * Returns where to send the user for a subscription with a pending crypto
 * payment, or `undefined` when there is nothing to resume.
 */
async function getPendingPaymentTarget(pendingSub: UserSubscription, paymentApi: CryptoPaymentApi): Promise<RouteLocationRaw | undefined> {
  const { durationInMonths, id, planId, planName } = pendingSub;
  const response = await paymentApi.checkPendingCryptoPayment(id);

  if (response.isError || !isDefined(planId))
    return undefined;

  const { currency, discount, pending, transactionStarted } = response.result;

  if (transactionStarted)
    return SUBSCRIPTION_PATH;

  if (!pending)
    return undefined;

  const queryParams: {
    plan: string;
    currency: string;
    period: string;
    discountCode: string;
    id?: string;
    planId: number;
  } = {
    currency: currency ?? '',
    discountCode: discount?.codeName ?? '',
    period: durationInMonths === 1 ? PricingPeriod.MONTHLY : PricingPeriod.YEARLY,
    plan: planName,
    planId,
  };

  if (id) {
    queryParams.id = id.toString();
  }

  return { path: CRYPTO_CHECKOUT_PATH, query: queryParams };
}

export default defineNuxtRouteMiddleware(async () => {
  const store = useMainStore();
  const { account, pendingSubscriptionId } = storeToRefs(store);

  /* Read pendingSubscriptionId BEFORE calling getAccount() to avoid a race. Cancelling
     a pending payment clears the ID in sessionStorage; calling getAccount() first would
     re-fetch it from the API and could set it again before the backend has processed
     the cancellation, causing a redirect loop. */
  const pendingSubId = get(pendingSubscriptionId);

  if (!pendingSubId) {
    return;
  }

  if (!get(account)) {
    await store.getAccount();
  }

  const { fetchUserSubscriptions } = useFetchUserSubscriptions();

  const userSubscriptions = await fetchUserSubscriptions();
  const pendingSub = userSubscriptions.find(({ id }) => id === pendingSubId);

  if (!pendingSub) {
    return;
  }

  const paymentApi = useCryptoPaymentApi();

  if (isSubRequestingUpgrade(pendingSub)) {
    const upgrade = await checkUpgradePayment(pendingSub, paymentApi);
    if (upgrade.done)
      return upgrade.target ? navigateTo(upgrade.target) : undefined;
  }

  const target = await getPendingPaymentTarget(pendingSub, paymentApi);
  if (target)
    return navigateTo(target);
});
