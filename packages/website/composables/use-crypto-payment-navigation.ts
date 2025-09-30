import { get } from '@vueuse/shared';
import { useUserSubscriptions } from '~/composables/use-user-subscriptions';

/**
 * Composable for handling crypto payment navigation
 */
export function useCryptoPaymentNavigation() {
  const { userSubscriptions } = useUserSubscriptions();
  const { subscriptionId, upgradeSubId } = useSubscriptionIdParam();
  const { planId } = usePlanIdParam();

  /**
   * Get the current crypto subscription ID if exists
   */
  const currentCryptoSubscriptionId = computed<string | undefined>(() => {
    const subs = get(userSubscriptions).filter(sub => sub.pending);

    if (subs.length > 1) {
      return subs.find(sub => sub.status === 'Active')?.id;
    }

    return undefined;
  });

  /**
   * Get the subscription ID to use (from params or current)
   */
  const usedSubscriptionId = computed<string | undefined>(
    () => get(subscriptionId) ?? get(currentCryptoSubscriptionId),
  );

  /**
   * Navigate back to the appropriate page
   */
  const navigateBack = async (): Promise<void> => {
    const id = get(usedSubscriptionId);
    const routeName = id ? 'checkout-pay-request-crypto' : 'checkout-pay-method';
    const currentPlanId = get(planId);

    const query: Record<string, string> = {};

    if (currentPlanId) {
      query.planId = String(currentPlanId);
    }

    if (id) {
      query.id = id;
    }

    await navigateTo({
      name: routeName,
      query,
    });
  };

  /**
   * Navigate to success page
   */
  const navigateToSuccess = async (): Promise<void> => {
    await navigateTo({ name: 'checkout-success', query: { crypto: '1' } });
  };

  /**
   * Navigate to subscription page
   */
  const navigateToSubscription = async (): Promise<void> => {
    await navigateTo('/home/subscription');
  };

  /**
   * Navigate to products page
   */
  const navigateToProducts = async (): Promise<void> => {
    await navigateTo('/products');
  };

  return {
    currentCryptoSubscriptionId,
    usedSubscriptionId,
    upgradeSubId,
    navigateBack,
    navigateToSuccess,
    navigateToSubscription,
    navigateToProducts,
  };
}
