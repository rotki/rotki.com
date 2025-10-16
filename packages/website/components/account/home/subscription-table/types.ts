import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { RouteLocationRaw } from 'vue-router';
import type { PendingTx } from '~/types';

export const SubscriptionAction = {
  UPGRADE: 'upgrade',
  CANCEL: 'cancel',
  RENEW: 'renew',
  RESUME: 'resume',
  CANCEL_UPGRADE: 'cancel-upgrade',
} as const;

export type SubscriptionActionType = typeof SubscriptionAction[keyof typeof SubscriptionAction];

export interface SubscriptionActionEvent {
  action: SubscriptionActionType;
  subscription: UserSubscription;
}

export interface OperationState {
  inProgress: boolean;
  operationType?: SubscriptionActionType;
  status?: string;
  activeAction?: SubscriptionActionType;
  activeSubscription?: UserSubscription;
}

export interface CryptoPaymentState {
  pendingTx: PendingTx | null;
  renewLink: RouteLocationRaw;
}
