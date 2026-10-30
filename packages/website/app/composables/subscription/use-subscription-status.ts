import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { ContextColorsType } from '@rotki/ui-library';
import { isCancelledButActive } from '@rotki/card-payment-common/utils/subscription';
import { useSubscriptionDisplay } from '~/composables/subscription/use-subscription-display';
import { formatDate } from '~/utils/date';

export function useSubscriptionStatus(subscription: MaybeRefOrGetter<UserSubscription>) {
  const { t } = useI18n({ useScope: 'global' });
  const { getChipStatusColor } = useSubscriptionDisplay();

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

  /** Chip color for the subscription's status, grey when the status has no color of its own. */
  const statusColor = computed<ContextColorsType | 'grey'>(() => getChipStatusColor(toValue(subscription).status) ?? 'grey');

  return {
    statusDisplayText,
    statusColor,
  };
}
