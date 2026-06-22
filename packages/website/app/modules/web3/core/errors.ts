import { classifyCryptoTxError } from '@rotki/sigil';
import { tag, type Tagged } from 'plainfp/tagged';

/**
 * Tagged, exhaustive error union for every fallible web3 operation. Replaces
 * the ad-hoc `error.shortMessage || error.message` extraction scattered across
 * the old composables. Consumers narrow on `_tag` (via `hasTag` or a switch)
 * to render a precise, translatable message.
 *
 * Pure module — only `plainfp/tagged` and the runtime-free `classifyCryptoTxError`
 * duck-typer from `@rotki/sigil`.
 */
interface ErrData {
  /** Best available human-readable message extracted from the cause. */
  readonly message: string;
  /** The original thrown value, kept for logging/classification. */
  readonly cause?: unknown;
}

export type Web3Error =
  | Tagged<'NoWallet', ErrData>
  | Tagged<'NotConnected', ErrData>
  | Tagged<'UserRejected', ErrData>
  | Tagged<'WrongChain', ErrData & { expected?: number; actual?: number }>
  | Tagged<'InsufficientFunds', ErrData>
  | Tagged<'ConnectFailed', ErrData>
  | Tagged<'SignFailed', ErrData>
  | Tagged<'SwitchChainFailed', ErrData>
  | Tagged<'TxFailed', ErrData>
  | Tagged<'Timeout', ErrData>
  // Domain/precondition failure carrying its own already-resolved message.
  | Tagged<'Validation', ErrData>;

/** Tags that {@link fromCause} may produce as a fallback when a cause is generic. */
type FallbackTag = 'ConnectFailed' | 'SignFailed' | 'SwitchChainFailed' | 'TxFailed';

export const noWallet = (message = 'No wallet available'): Web3Error => tag('NoWallet')({ message });

export const notConnected = (message = 'Wallet not connected'): Web3Error => tag('NotConnected')({ message });

export const userRejected = (message = 'Request rejected', cause?: unknown): Web3Error => tag('UserRejected')({ cause, message });

export const insufficientFunds = (message = 'Insufficient funds', cause?: unknown): Web3Error => tag('InsufficientFunds')({ cause, message });

export const timeout = (message = 'The operation timed out'): Web3Error => tag('Timeout')({ message });

export const validation = (message: string): Web3Error => tag('Validation')({ message });

export function wrongChain(expected: number, actual: number | undefined, message?: string): Web3Error {
  return tag('WrongChain')({ actual, expected, message: message ?? `Wrong network. Expected chain ${expected}, got ${actual ?? 'none'}` });
}

/** Extract the most specific message available from an unknown thrown value. */
export function messageOf(cause: unknown): string {
  if (typeof cause === 'object' && cause !== null) {
    if ('shortMessage' in cause && typeof cause.shortMessage === 'string')
      return cause.shortMessage;
    if ('message' in cause && typeof cause.message === 'string')
      return cause.message;
  }
  if (typeof cause === 'string')
    return cause;
  return 'Unknown error';
}

/**
 * i18n key for a {@link Web3Error}, e.g. `web3_errors.UserRejected`. Components
 * render `t(web3ErrorKey(error))` for a localized message, falling back to the
 * raw `error.message` when a translation is missing.
 */
export function web3ErrorKey(error: Web3Error): string {
  return `web3_errors.${error._tag}`;
}

/**
 * Map an arbitrary thrown value (viem / EIP-1193 error) into a {@link Web3Error}.
 * Reuses the shared `classifyCryptoTxError` duck-typer so user-rejection and
 * insufficient-funds detection stays in sync with the payment logging path; any
 * other failure falls back to the supplied `fallback` tag.
 */
export function fromCause(cause: unknown, fallback: FallbackTag = 'TxFailed'): Web3Error {
  const message = messageOf(cause);
  const classified = classifyCryptoTxError(cause);
  if (classified === 'CRYPTO_USER_REJECTED')
    return userRejected(message, cause);
  if (classified === 'CRYPTO_INSUFFICIENT_FUNDS')
    return insufficientFunds(message, cause);
  return tag(fallback)({ cause, message });
}
