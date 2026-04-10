// Sigil event payload shapes — one interface per event in `SigilEvents`.
// `SigilEventPayloadMap` ties event-name → payload type for callers.
//
// All interfaces use camelCase keys (matching the codebase convention).
// Conversion to snake_case happens at the tracking boundary via
// `toSnakeCaseKeys` from `./case`.

import type {
  ActivationFailedReason,
  CardType,
  CheckoutPaymentMethod,
  CheckoutStep,
  DiscountRejectedReason,
  DiscountType,
  LoginFailedReason,
  PlanDuration,
  SignupFailedReason,
} from './common';
import type { SigilEvents } from './events';
import type { PaymentFailedReason } from './failures';

export interface PaymentSubmittedPayload {
  paymentMethod: CheckoutPaymentMethod;
  planId?: number;
  planDuration?: PlanDuration;
  isUpgrade: boolean;
  cardType?: CardType;
  discountApplied?: boolean;
}

export interface PaymentFailedPayload {
  paymentMethod: CheckoutPaymentMethod;
  reason: PaymentFailedReason;
  planId?: number;
  isUpgrade: boolean;
  step?: CheckoutStep;
  cardType?: CardType;
  discountApplied?: boolean;
}

export interface PurchaseSuccessPayload {
  paymentMethod: CheckoutPaymentMethod;
  planId: number;
  planName?: string;
  planDuration: PlanDuration;
  revenue?: number;
  currency: 'EUR';
  isUpgrade: boolean;
  discount?: DiscountType;
}

export interface UpgradeStartedPayload {
  fromPlanId?: number;
  fromPlanName: string;
  toPlanId: number;
  toPlanDuration: PlanDuration;
  source: 'account_home';
}

export interface CheckoutStartPayload {
  planId?: number;
  planName?: string;
  planDuration: PlanDuration;
  amount?: string;
  isUpgrade: boolean;
  discount?: DiscountType;
}

export interface CheckoutMethodSelectedPayload {
  method?: CheckoutPaymentMethod;
  planId?: number;
}

export interface PricingViewPayload {
  period: string;
}

export interface DiscountCodeAppliedPayload {
  planId?: number;
}

export interface DiscountCodeRejectedPayload {
  planId?: number;
  reason?: DiscountRejectedReason;
}

export interface DownloadClickPayload {
  platform: string;
  version?: string;
}

export interface Card3dsChallengeShownPayload {
  planId?: number;
  isUpgrade: boolean;
}

export interface DownloadSeePlansClickPayload {
  source: 'download_page_nudge';
}

// Auth funnel payloads

export type EmptyPayload = Record<string, never>;

export interface SignupFailedPayload {
  reason: SignupFailedReason;
}

export interface LoginFailedPayload {
  reason: LoginFailedReason;
}

export interface ActivationFailedPayload {
  reason: ActivationFailedReason;
}

export interface CryptoTxSubmittedPayload {
  chainId?: number;
  asset: string;
}

export interface PageNotFoundPayload {
  path: string;
}

export interface SubscriptionLifecyclePayload {
  planName: string;
  durationInMonths: number;
}

export interface SigilEventPayloadMap {
  [SigilEvents.PAYMENT_SUBMITTED]: PaymentSubmittedPayload;
  [SigilEvents.PAYMENT_FAILED]: PaymentFailedPayload;
  [SigilEvents.PURCHASE_SUCCESS]: PurchaseSuccessPayload;
  [SigilEvents.UPGRADE_STARTED]: UpgradeStartedPayload;
  [SigilEvents.CHECKOUT_START]: CheckoutStartPayload;
  [SigilEvents.CHECKOUT_METHOD_SELECTED]: CheckoutMethodSelectedPayload;
  [SigilEvents.CARD_3DS_CHALLENGE_SHOWN]: Card3dsChallengeShownPayload;
  [SigilEvents.PRICING_VIEW]: PricingViewPayload;
  [SigilEvents.DISCOUNT_CODE_APPLIED]: DiscountCodeAppliedPayload;
  [SigilEvents.DISCOUNT_CODE_REJECTED]: DiscountCodeRejectedPayload;
  [SigilEvents.DOWNLOAD_CLICK]: DownloadClickPayload;
  [SigilEvents.DOWNLOAD_SEE_PLANS_CLICK]: DownloadSeePlansClickPayload;
  [SigilEvents.SIGNUP_STARTED]: EmptyPayload;
  [SigilEvents.SIGNUP_COMPLETED]: EmptyPayload;
  [SigilEvents.SIGNUP_FAILED]: SignupFailedPayload;
  [SigilEvents.LOGIN_STARTED]: EmptyPayload;
  [SigilEvents.LOGIN_COMPLETED]: EmptyPayload;
  [SigilEvents.LOGIN_FAILED]: LoginFailedPayload;
  [SigilEvents.ACTIVATION_COMPLETED]: EmptyPayload;
  [SigilEvents.ACTIVATION_FAILED]: ActivationFailedPayload;
  [SigilEvents.PASSWORD_RESET_COMPLETED]: EmptyPayload;
  [SigilEvents.CRYPTO_TX_SUBMITTED]: CryptoTxSubmittedPayload;
  [SigilEvents.PAGE_NOT_FOUND]: PageNotFoundPayload;
  [SigilEvents.SUBSCRIPTION_CANCELLED]: SubscriptionLifecyclePayload;
  [SigilEvents.SUBSCRIPTION_RESUMED]: SubscriptionLifecyclePayload;
}
