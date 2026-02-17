import type { Account } from '@rotki/card-payment-common/schemas/account';
import { getAccount } from '@/utils/api';

export async function canBuyNewSubscription(): Promise<{ canBuy: boolean; account?: Account }> {
  const account = await getAccount();

  if (!account) {
    console.warn('User not authenticated, redirecting to subscription page');
    return { canBuy: false };
  }

  if (!account.emailConfirmed) {
    console.warn('User email not confirmed, redirecting to subscription page');
    return { canBuy: false };
  }

  // Card payments are only for new subscriptions, not renewals
  // Users with active subscriptions should use crypto payments for renewals
  if (account.hasActiveSubscription) {
    console.warn('User has active subscription, card payment not available - use crypto for renewals');
    return { canBuy: false };
  }

  return { canBuy: true, account };
}
