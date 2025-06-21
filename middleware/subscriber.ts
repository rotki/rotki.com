import { useMainStore } from '~/store';
import { canBuyNewSubscription } from '~/utils/subscription';

export default defineNuxtRouteMiddleware(async () => {
  const { account, userSubscriptions } = useMainStore();
  const canBuy = canBuyNewSubscription(account, userSubscriptions);

  if (!canBuy) {
    return navigateTo('/home/subscription');
  }
});
