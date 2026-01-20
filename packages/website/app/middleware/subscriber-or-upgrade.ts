import { navigateTo } from '#imports';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async (to) => {
  const store = useMainStore();
  const { account, canBuy } = storeToRefs(store);

  // Only fetch account if not already loaded
  if (!get(account)) {
    await store.getAccount();
  }

  const upgradeSubId = to.query.upgradeSubId;

  if (!get(canBuy) && !upgradeSubId) {
    return navigateTo('/home/subscription');
  }
});
