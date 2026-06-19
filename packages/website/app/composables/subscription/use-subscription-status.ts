import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { isCancelledButActive } from '@rotki/card-payment-common';
import { formatDate } from '~/utils/date';

export function useSubscriptionStatus(subscription: MaybeRefOrGetter<UserSubscription>) {
  const { t } = useI18n({ useScope: 'global' });

  /**
   * Returns formatted status text, including cancellation date for cancelled-but-active subscriptions
   */
  const statusDisplayText = computed<string>(() => {
    const sub = toValue(subscription);
    if (isCancelledButActive(sub)) {
      return t('account.subscriptions.cancelled_but_still_active.status', {
        date: formatDate(sub.nextActionDate),
      });
    }
    return sub.status;
  });

  /**
   * Returns CSS classes for card border styling based on subscription status
   */
  const statusCardClass = computed<string>(() => {
    const status = toValue(subscription).status;
    // Error states (red)
    if (status === 'Cancelled' || status === 'Payment Failed') {
      return '!border-l-4 !border-l-rui-error';
    }
    // Warning states (yellow/orange)
    if (status === 'Past Due' || status === 'Pending' || status === 'Upgrade Requested') {
      return '!border-l-4 !border-l-rui-warning';
    }
    // Success states (green)
    if (status === 'Active' || status === 'Cancelled but still active') {
      return '!border-l-4 !border-l-rui-success';
    }
    return '';
  });

  return {
    statusDisplayText,
    statusCardClass,
  };
}
