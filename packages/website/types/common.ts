import type { Ref } from 'vue';
import type { ApiError } from '~/types/index';

export interface ActionResult {
  readonly success: boolean;
  readonly message?: ApiError;
}

export interface BaseErrorObject { $message: string | Ref<string> }

export interface PayEvent {
  planId: number;
  paymentMethodNonce: string;
  discountCode?: string;
}

export type ValidationErrors = Record<string, string[] | string>;
