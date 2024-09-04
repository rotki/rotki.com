import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { canBuyNewSubscription } from '~/utils/subscription';

export default defineNuxtRouteMiddleware(async () => {
  const { account } = storeToRefs(useMainStore());

  const canBuy = canBuyNewSubscription(account);

  if (!canBuy) {
    return navigateTo('/home/subscription');
  }
});
