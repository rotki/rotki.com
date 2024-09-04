import { get } from '@vueuse/core';
import type { Account } from '~/types';

export function canBuyNewSubscription(account: Ref<Account | null>): boolean {
  if (!isDefined(account))
    return true;

  const { hasActiveSubscription, subscriptions } = get(account);

  if (!hasActiveSubscription)
    return true;

  const renewableSubscriptions = subscriptions.filter(({ actions }) =>
    actions.includes('renew'),
  );

  return renewableSubscriptions.length > 0;
}
