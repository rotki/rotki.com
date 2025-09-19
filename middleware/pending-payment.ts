import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { getPricingPeriod } from '~/components/pricings/utils';
import { useMainStore } from '~/store';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { isSubPending, isSubRequestingUpgrade } from '~/utils/subscription';

export default defineNuxtRouteMiddleware(async () => {
  const store = useMainStore();
  const { refreshUserData } = store;
  const { account, userSubscriptions } = storeToRefs(store);
  const { checkCryptoUpgradePayment, checkPendingCryptoPayment } = usePaymentCryptoStore();

  if (!get(account)) {
    await refreshUserData();
  }

  const pendingSub = get(userSubscriptions).find(
    sub => sub.actions.includes('renew') || isSubPending(sub) || isSubRequestingUpgrade(sub),
  );

  if (!pendingSub) {
    return;
  }

  const { durationInMonths, id, planId, planName } = pendingSub;

  if (isSubRequestingUpgrade(pendingSub)) {
    const response = await checkCryptoUpgradePayment(id);

    if (response.isError || !isDefined(planId))
      return;

    const { currency, pending, toPlan, transactionStarted } = response.result;

    if (transactionStarted) {
      return navigateTo('/home/subscription');
    }
    else if (pending) {
      const queryParams: {
        plan: string;
        currency: string;
        period: string;
        upgradeSubId: string;
        planId: number;
      } = {
        currency: currency ?? '',
        period: getPricingPeriod(durationInMonths),
        plan: toPlan.tier.name,
        planId: toPlan.id,
        upgradeSubId: id,
      };

      return navigateTo({
        path: '/checkout/pay/crypto',
        query: queryParams,
      });
    }
  }

  const identifier = isSubPending(pendingSub) ? undefined : id;
  const response = await checkPendingCryptoPayment(identifier);

  if (response.isError || !isDefined(planId))
    return;

  const { currency, discount, pending, transactionStarted } = response.result;

  if (transactionStarted) {
    return navigateTo('/home/subscription');
  }
  else if (pending) {
    const queryParams: {
      plan: string;
      currency: string;
      period: string;
      discountCode: string;
      id?: string;
      planId: number;
    } = {
      currency: currency ?? '',
      discountCode: discount?.codeName ?? '',
      period: getPricingPeriod(durationInMonths),
      plan: planName,
      planId,
    };
    if (identifier)
      queryParams.id = identifier.toString();

    return navigateTo({
      path: '/checkout/pay/crypto',
      query: queryParams,
    });
  }
});
