import { type Ref } from 'vue';
import { type ApiError } from '~/types/index';

export type ActionResult = {
  readonly success: boolean;
  readonly message?: ApiError;
};

export type BaseErrorObject = { $message: string | Ref<string> };

export type PayEvent = { months: number; nonce: string };

export type ValidationErrors = Record<string, string[] | string>;
