import { defineNuxtRouteMiddleware, navigateTo } from '#imports';
import { useMainStore } from '~/store';
import { canBuyNewSubscription } from '~/utils/subscription';

export default defineNuxtRouteMiddleware(async () => {
  const { account } = useMainStore();
  const canBuy = canBuyNewSubscription(account);

  if (!canBuy) {
    return navigateTo('/home/subscription');
  }
});
