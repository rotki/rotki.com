import { navigateTo } from '#imports';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

export default defineNuxtRouteMiddleware(async (to) => {
  const store = useMainStore();
  const { canBuy } = storeToRefs(store);

  // Ensure account data is loaded
  await store.getAccount();

  const upgradeSubId = to.query.upgradeSubId;

  if (!canBuy.value && !upgradeSubId) {
    return navigateTo('/home/subscription');
  }
});
