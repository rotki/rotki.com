export type ApiError = string | Record<string, string[]>;

export interface ActionResult {
  readonly success: boolean;
  readonly message?: ApiError;
}

export interface PayEvent {
  planId: number;
  paymentMethodNonce: string;
  discountCode?: string;
  upgradeSubId?: string;
}

export type ValidationErrors = Record<string, string[] | string>;
