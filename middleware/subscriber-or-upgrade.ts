import { useMainStore } from '~/store';
import { canBuyNewSubscription } from '~/utils/subscription';

export default defineNuxtRouteMiddleware(async (to) => {
  const { account, userSubscriptions } = useMainStore();
  const canBuy = canBuyNewSubscription(account, userSubscriptions);

  const upgradeSubId = to.query.upgradeSubId ? parseInt(to.query.planId as string) : undefined;

  if (!canBuy && !isDefined(upgradeSubId)) {
    return navigateTo('/home/subscription');
  }
});
