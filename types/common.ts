import { type Ref } from 'vue';
import { type ApiError } from '~/types/index';

export type DataTableHeader = {
  readonly text: string;
  readonly value: string;
  readonly className?: string;
  readonly sortable?: boolean;
};

export type ActionResult = {
  readonly success: boolean;
  readonly message?: ApiError;
};

export type BaseErrorObject = { $message: string | Ref<string> };

export type PayEvent = { months: number; nonce: string };

export type ValidationErrors = Record<string, string[] | string>;
