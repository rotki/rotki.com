import type { ApiError } from '~/types/index';

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
