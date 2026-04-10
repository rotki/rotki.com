// Single source of truth for every Sigil event name this project fires.
// Use `SigilEvents.X` instead of raw strings so renames happen once and
// typos become type errors.

import type { EnumValueOf } from './common';

export const SigilEvents = {
  PAYMENT_SUBMITTED: 'payment_submitted',
  PAYMENT_FAILED: 'payment_failed',
  PURCHASE_SUCCESS: 'purchase_success',
  UPGRADE_STARTED: 'upgrade_started',
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_METHOD_SELECTED: 'checkout_method_selected',
  CARD_3DS_CHALLENGE_SHOWN: 'card_3ds_challenge_shown',
  DISCOUNT_CODE_APPLIED: 'discount_code_applied',
  DISCOUNT_CODE_REJECTED: 'discount_code_rejected',
  PRICING_VIEW: 'pricing_view',
  DOWNLOAD_CLICK: 'download_click',
  DOWNLOAD_SEE_PLANS_CLICK: 'download_see_plans_click',
  SIGNUP_STARTED: 'signup_started',
  SIGNUP_COMPLETED: 'signup_completed',
  SIGNUP_FAILED: 'signup_failed',
  LOGIN_STARTED: 'login_started',
  LOGIN_COMPLETED: 'login_completed',
  LOGIN_FAILED: 'login_failed',
  ACTIVATION_COMPLETED: 'activation_completed',
  ACTIVATION_FAILED: 'activation_failed',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  CRYPTO_TX_SUBMITTED: 'crypto_tx_submitted',
  PAGE_NOT_FOUND: 'page_not_found',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RESUMED: 'subscription_resumed',
} as const;

export type SigilEventName = EnumValueOf<typeof SigilEvents>;
