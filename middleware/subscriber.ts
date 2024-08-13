import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const { account } = storeToRefs(useMainStore());

  if (!isDefined(account))
    return;

  const { hasActiveSubscription, subscriptions } = get(account);
  if (hasActiveSubscription) {
    const renewableSubscriptions = subscriptions.filter(({ actions }) =>
      actions.includes('renew'),
    );

    if (!renewableSubscriptions)
      return navigateTo('/home/subscription');
  }
});
