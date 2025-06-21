import type { UserSubscription } from '~/types';
import type { Account } from '~/types/account';

export function canBuyNewSubscription(account: Account | null, subscriptions: UserSubscription[]): boolean {
  if (subscriptions.length === 0 || !account)
    return true;

  const { hasActiveSubscription } = account;

  if (!hasActiveSubscription)
    return true;

  const renewableSubscriptions = subscriptions.filter(({ actions }) =>
    actions.includes('renew'),
  );

  return renewableSubscriptions.length > 0;
}
