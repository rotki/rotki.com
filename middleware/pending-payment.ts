import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const store = useMainStore();
  const { account } = storeToRefs(store);
  if (!isDefined(account))
    return;

  const { subscriptions } = get(account);

  const pending = subscriptions.filter(
    ({ actions, status }) => actions.includes('renew') || status === 'Pending',
  );

  if (pending.length > 0) {
    const { durationInMonths, identifier, status } = pending[0];
    const id = status === 'Pending' ? undefined : identifier;
    const response = await store.checkPendingCryptoPayment(id);

    if (response.isError)
      return;

    if (response.result?.transactionStarted) {
      return navigateTo('/home/subscription');
    }
    else if (response.result.pending) {
      const queryParams: { plan: string; currency: string; id?: string } = {
        currency: response.result.currency ?? '',
        plan: durationInMonths.toString(),
      };
      if (id)
        queryParams.id = id;

      return navigateTo({
        path: '/checkout/pay/crypto',
        query: queryParams,
      });
    }
  }
});
