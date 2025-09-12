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

export function isSubActive(sub: UserSubscription) {
  return sub.status === 'Active';
}

export function isSubPending(sub: UserSubscription) {
  return sub.status === 'Pending';
}

export function isSubRequestingUpgrade(sub: UserSubscription) {
  return sub.status === 'Upgrade Requested';
}
