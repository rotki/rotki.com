import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { ContextColorsType } from '@rotki/ui-library';
import { getPlanNameFor } from '~/utils/plans';

interface UseSubscriptionDisplayReturn {
  getPlanDisplayName: (subscription: UserSubscription) => string;
  getChipStatusColor: (status: string) => ContextColorsType | undefined;
  actionsClasses: string;
}

export function useSubscriptionDisplay(): UseSubscriptionDisplayReturn {
  const { t } = useI18n({ useScope: 'global' });

  /**
   * Get the display name for a subscription plan
   */
  function getPlanDisplayName(subscription: UserSubscription): string {
    if (subscription.isLegacy)
      return subscription.planName;

    return getPlanNameFor(t, {
      durationInMonths: subscription.durationInMonths,
      name: subscription.planName,
    });
  }

  /**
   * Get the color for a subscription status chip
   */
  function getChipStatusColor(status: string): ContextColorsType | undefined {
    const statusColorMap: Record<string, ContextColorsType> = {
      'Active': 'success',
      'Cancelled but still active': 'success',
      'Cancelled': 'error',
      'Pending': 'warning',
      'Upgrade Requested': 'warning',
      'Past Due': 'warning',
    };

    return statusColorMap[status];
  }

  /**
   * CSS classes for action buttons
   */
  const actionsClasses: string = '!px-1 !py-0 hover:underline !leading-[1.2rem] gap-1';

  return {
    actionsClasses,
    getChipStatusColor,
    getPlanDisplayName,
  };
}
