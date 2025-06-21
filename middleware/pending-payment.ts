import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { PricingPeriod } from '~/types/tiers';

export default defineNuxtRouteMiddleware(async () => {
  const store = useMainStore();
  const { refreshUserData } = store;
  const { account, userSubscriptions } = storeToRefs(store);
  const { checkPendingCryptoPayment } = usePaymentCryptoStore();

  if (!get(account)) {
    await refreshUserData();
  }

  const pendingSub = get(userSubscriptions).filter(
    ({ actions, status }) => actions.includes('renew') || status === 'Pending',
  );

  if (pendingSub.length > 0) {
    const { durationInMonths, id, planName, status } = pendingSub[0];
    const identifier = status === 'Pending' ? undefined : id;
    const response = await checkPendingCryptoPayment(identifier);

    if (response.isError)
      return;

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
        discountCode: discount?.codeName ?? '',
        period: durationInMonths === 1 ? PricingPeriod.MONTHLY : PricingPeriod.YEARLY,
        plan: planName,
      };
      if (identifier)
        queryParams.id = identifier.toString();

      return navigateTo({
        path: '/checkout/pay/crypto',
        query: queryParams,
      });
    }
  }
});
