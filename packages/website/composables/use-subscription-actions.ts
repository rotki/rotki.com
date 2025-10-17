import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { isSubActive, isSubPending, isSubRequestingUpgrade } from '@rotki/card-payment-common';
import { get } from '@vueuse/shared';
import { SubscriptionAction, type SubscriptionActionType } from '~/components/account/home/subscription-table/types';
import { getHighestPlanOnPeriod } from '~/components/pricings/utils';

interface UseSubscriptionActionsReturn {
  canCancelSubscription: (sub: UserSubscription) => boolean;
  canRenewSubscription: (sub: UserSubscription) => boolean;
  canUpgradeSubscription: (sub: UserSubscription, availablePlans: AvailablePlans) => boolean;
  canContinuePayment: (sub: UserSubscription) => boolean;
  hasAction: (sub: UserSubscription, action: SubscriptionActionType, availablePlans?: AvailablePlans) => boolean;
  displayActions: (sub: UserSubscription, availablePlans?: AvailablePlans) => boolean;
}

export function useSubscriptionActions(): UseSubscriptionActionsReturn {
  /**
   * Check if a subscription can be cancelled
   */
  function canCancelSubscription(sub: UserSubscription): boolean {
    return !isSubPending(sub) && !isSubRequestingUpgrade(sub) && sub.actions.includes('cancel');
  }

  /**
   * Check if a subscription can be renewed
   */
  function canRenewSubscription(sub: UserSubscription): boolean {
    return sub.actions.includes('renew');
  }

  /**
   * Check if a subscription can be upgraded
   */
  function canUpgradeSubscription(sub: UserSubscription, availablePlans: AvailablePlans): boolean {
    if (!isSubActive(sub) || sub.isSoftCanceled || sub.isLegacy || !sub.actions.includes('cancel'))
      return false;

    const plans = get(availablePlans);
    if (plans.length === 0)
      return false;

    const highestPlanName = getHighestPlanOnPeriod(plans, sub.durationInMonths);
    return !!highestPlanName && highestPlanName !== sub.planName;
  }

  /**
   * Check if a user can continue with a pending payment
   */
  function canContinuePayment(sub: UserSubscription): boolean {
    return isSubPending(sub) || isSubRequestingUpgrade(sub);
  }

  /**
   * Check if a subscription has a specific action available
   */
  function hasAction(sub: UserSubscription, action: SubscriptionActionType, availablePlans: AvailablePlans = []): boolean {
    switch (action) {
      case SubscriptionAction.CANCEL:
        return canCancelSubscription(sub);
      case SubscriptionAction.RENEW:
        return canRenewSubscription(sub);
      case SubscriptionAction.UPGRADE:
        return canUpgradeSubscription(sub, availablePlans);
      case SubscriptionAction.RESUME:
        return sub.isSoftCanceled;
      case SubscriptionAction.CANCEL_UPGRADE:
        return false; // Not applicable for action availability check
    }
  }

  /**
   * Check if a subscription should display any actions
   */
  function displayActions(sub: UserSubscription, availablePlans: AvailablePlans = []): boolean {
    return canRenewSubscription(sub)
      || canCancelSubscription(sub)
      || canUpgradeSubscription(sub, availablePlans)
      || canContinuePayment(sub)
      || sub.isSoftCanceled;
  }

  return {
    canCancelSubscription,
    canContinuePayment,
    canRenewSubscription,
    canUpgradeSubscription,
    displayActions,
    hasAction,
  };
}
