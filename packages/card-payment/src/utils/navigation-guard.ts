import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { ResultAsync } from 'plainfp/result-async';
import type { ApiFailure } from '@/utils/api-failure';
import { ok } from 'plainfp/result';
import { getAccount } from '@/utils/api';

interface PurchaseAccess {
  canBuy: boolean;
  account?: Account;
}

/** Whether the visitor can start a subscription; failing to check says neither, so it stays a failure. */
export async function canBuyNewSubscription(): ResultAsync<PurchaseAccess, ApiFailure> {
  const current = await getAccount();
  if (!current.ok)
    return current;

  const account = current.value;

  if (!account) {
    console.warn('User not authenticated, redirecting to subscription page');
    return ok({ canBuy: false });
  }

  if (!account.emailConfirmed) {
    console.warn('User email not confirmed, redirecting to subscription page');
    return ok({ canBuy: false });
  }

  // Card payments are only for new subscriptions; renewals go through crypto payments.
  if (account.hasActiveSubscription) {
    console.warn('User has active subscription, card payment not available - use crypto for renewals');
    return ok({ canBuy: false });
  }

  return ok({ canBuy: true, account });
}
