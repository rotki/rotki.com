import { isSubRequestingUpgrade } from '@rotki/card-payment-common';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { getPricingPeriod } from '~/components/pricings/utils';
import { useCryptoPaymentApi } from '~/composables/checkout/use-crypto-payment-api';
import { useFetchUserSubscriptions } from '~/composables/subscription/use-fetch-user-subscriptions';
import { useMainStore } from '~/store';
import { PricingPeriod } from '~/types/tiers';

export default defineNuxtRouteMiddleware(async () => {
  const store = useMainStore();
  const { account, pendingSubscriptionId } = storeToRefs(store);

  if (!get(account)) {
    await store.getAccount();
  }

  const pendingSubId = get(pendingSubscriptionId);

  if (!pendingSubId) {
    return;
  }

  const { fetchUserSubscriptions } = useFetchUserSubscriptions();

  const userSubscriptions = await fetchUserSubscriptions();
  const pendingSub = userSubscriptions.find(({ id }) => id === pendingSubId);

  if (!pendingSub) {
    return;
  }

  const paymentApi = useCryptoPaymentApi();

  const { durationInMonths, id, planId, planName } = pendingSub;

  if (isSubRequestingUpgrade(pendingSub)) {
    const response = await paymentApi.checkCryptoUpgradePayment(id);

    if (response.isError || !isDefined(planId))
      return;

    const { currency, pending, toPlan, transactionStarted } = response.result;

    if (transactionStarted) {
      return navigateTo('/home/subscription');
    }
    else if (pending) {
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

      return navigateTo({
        path: '/checkout/pay/crypto',
        query: queryParams,
      });
    }
  }

  const response = await paymentApi.checkPendingCryptoPayment(id);

  if (response.isError || !isDefined(planId)) {
    return;
  }

  const { currency, discount, pending, transactionStarted } = response.result;

  if (transactionStarted) {
    return navigateTo('/home/subscription');
  }
  else if (pending) {
    const queryParams: {
      plan: string;
      currency: string;
      period: string;
      discountCode: string;
      id?: string;
      planId: number;
    } = {
      currency: currency ?? '',
      discountCode: discount?.codeName || '',
      period: durationInMonths === 1 ? PricingPeriod.MONTHLY : PricingPeriod.YEARLY,
      plan: planName,
      planId,
    };

    if (id) {
      queryParams.id = id.toString();
    }

    return navigateTo({
      path: '/checkout/pay/crypto',
      query: queryParams,
    });
  }
});
