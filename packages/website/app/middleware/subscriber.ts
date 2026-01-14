import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const store = useMainStore();
  const { canBuy, account } = storeToRefs(store);

  if (!get(account)) {
    // Ensure account data is loaded
    await store.getAccount();
  }

  if (!get(canBuy)) {
    return navigateTo('/home/subscription');
  }
});
