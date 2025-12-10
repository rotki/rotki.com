import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { PremiumTierInfo, PremiumTierInfoDescription } from '~/types/tiers';
import { get } from '@vueuse/shared';
import { useSubscriptionDisplay } from '~/composables/subscription/use-subscription-display';
import { usePremiumTiersInfo } from '~/composables/tiers/use-premium-tiers-info';

export function useSubscriptionPlanInfo(subscription: Ref<UserSubscription>) {
  const { getPlanDisplayName } = useSubscriptionDisplay();
  const { tiersInformation } = usePremiumTiersInfo();

  /**
   * Finds the tier information for the subscription's plan
   */
  const tierInfo = computed<PremiumTierInfo | undefined>(() => {
    const tiers = get(tiersInformation);
    const sub = subscription.value;
    return tiers.find(tier => tier.name.toLowerCase() === sub.planName.toLowerCase());
  });

  /**
   * Returns the plan limits/description from the tier information
   */
  const planLimits = computed<PremiumTierInfoDescription[]>(() => {
    const info = get(tierInfo);
    if (!info || !info.description) {
      return [];
    }

    return info.description;
  });

  /**
   * Returns the formatted display name for the plan
   */
  const planDisplayName = computed<string>(() => getPlanDisplayName(subscription.value));

  return {
    tierInfo,
    planLimits,
    planDisplayName,
  };
}
