import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { InjectionKey } from 'vue';
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

/** How the action buttons look: compact text links in the table, full buttons on the plan card. */
export interface ActionButtonStyle {
  variant: 'text' | 'outlined';
  /** Unset means the library's default button size. */
  size?: 'sm';
}

export const ActionButtonStyleKey: InjectionKey<ActionButtonStyle> = Symbol('subscription-action-button-style');

/** The style the surrounding actions cell asks for, compact links by default. */
export function useActionButtonStyle(): ActionButtonStyle {
  return inject(ActionButtonStyleKey, { variant: 'text', size: 'sm' });
}
