export type CardFieldKey = 'number' | 'expirationDate' | 'cvv';

export interface CardFieldEvent {
  /** Braintree can name more fields than the form uses. */
  emittedBy: string;
  fields: Record<CardFieldKey, { isValid: boolean }>;
}

/** The part of Braintree's hosted fields the card form uses. */
export interface CardFieldsInstance {
  on: (event: 'focus' | 'blur' | 'validityChange', handler: (event: CardFieldEvent) => void) => void;
  setAttribute: (options: { field: CardFieldKey; attribute: 'disabled'; value: boolean }) => unknown;
  removeAttribute: (options: { field: CardFieldKey; attribute: 'disabled' }) => unknown;
  tokenize: () => Promise<{ nonce: string; details: { bin: string } }>;
  teardown: () => Promise<void>;
}

export interface CardFieldsOptions {
  styles: Record<string, Record<string, string>>;
  fields: Record<CardFieldKey, { container: string; placeholder?: string }>;
}

/**
 * Sets the hosted fields up. The app supplies it, bound to its Braintree client, as third-party
 * runtime code stays in the apps and the shared card form must not reach the SDK itself.
 */
export type CreateCardFields = (options: CardFieldsOptions) => Promise<CardFieldsInstance>;
