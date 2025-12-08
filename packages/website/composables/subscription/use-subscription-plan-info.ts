import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { PremiumTierInfo, PremiumTierInfoDescription } from '~/types/tiers';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useSubscriptionDisplay } from '~/composables/subscription/use-subscription-display';
import { useTiersStore } from '~/store/tiers';

export function useSubscriptionPlanInfo(subscription: Ref<UserSubscription>) {
  const { getPlanDisplayName } = useSubscriptionDisplay();
  const tiersStore = useTiersStore();
  const { tiersInformation } = storeToRefs(tiersStore);

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
