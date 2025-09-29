import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async () => {
  const store = useMainStore();
  const { canBuy } = storeToRefs(store);

  // Ensure account data is loaded
  await store.getAccount();

  if (!canBuy.value) {
    return navigateTo('/home/subscription');
  }
});
