import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useFetchUserSubscriptions } from '~/composables/use-fetch-user-subscriptions';
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

  if (pendingSub) {
    const paymentApi = useCryptoPaymentApi();

    const { durationInMonths, id, planName, status } = pendingSub;
    const identifier = status === 'Pending' ? undefined : id;
    const response = await paymentApi.checkPendingCryptoPayment(id);

    if (response.isError) {
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
      } = {
        currency: currency ?? '',
        discountCode: discount?.codeName || '',
        period: durationInMonths === 1 ? PricingPeriod.MONTHLY : PricingPeriod.YEARLY,
        plan: planName,
      };

      if (identifier) {
        queryParams.id = identifier.toString();
      }

      return navigateTo({
        path: '/checkout/pay/crypto',
        query: queryParams,
      });
    }
  }
});
