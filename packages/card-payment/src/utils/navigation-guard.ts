import { getAccount } from '@/utils/api';

export async function canBuyNewSubscription(): Promise<boolean> {
  const account = await getAccount();

  if (!account) {
    console.warn('User not authenticated, redirecting to subscription page');
    return false;
  }

  if (!account.emailConfirmed) {
    console.warn('User email not confirmed, redirecting to subscription page');
    return false;
  }

  // Card payments are only for new subscriptions, not renewals
  // Users with active subscriptions should use crypto payments for renewals
  if (account.hasActiveSubscription) {
    console.warn('User has active subscription, card payment not available - use crypto for renewals');
    return false;
  }

  return true;
}
