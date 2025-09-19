import type { Account } from '~/types';

export function canBuyNewSubscription(account: Account | null): boolean {
  if (!account)
    return true;

  const { hasActiveSubscription, subscriptions } = account;

  if (!hasActiveSubscription)
    return true;

  const renewableSubscriptions = subscriptions.filter(({ actions }) =>
    actions.includes('renew'),
  );

  return renewableSubscriptions.length > 0;
}
