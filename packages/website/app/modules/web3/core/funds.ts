/**
 * Pure pre-flight funds check shared by the crypto-payment and sponsorship-mint
 * flows. No viem, no reactivity — just decimal-string comparisons (matching the
 * `Number.parseFloat` convention already used in `mint-state`).
 *
 * The two shortfalls are intentionally kept separate because they differ in
 * certainty:
 *  - `tokenShortfall` is *certain* (the balance is provably below the price) and
 *    should drive a hard block (disabled pay/mint button).
 *  - `gasShortfall` is an *estimate* (gas is predicted, not yet spent) and should
 *    only drive a soft, non-blocking warning — never disable the action on it.
 *
 * Whenever a needed figure is still missing (empty/NaN while balances load) the
 * status is neutral (no shortfall), so the UI never blocks or warns on
 * not-yet-known data.
 */
export interface FundsStatusParams {
  /** Human-readable balance of the token being paid with. */
  tokenBalance: string;
  /** Human-readable native-coin balance, used to cover gas. */
  nativeBalance: string;
  /** Human-readable price/amount to pay, in the payment token. */
  price: string;
  /** Human-readable estimated network fee, denominated in the native coin. */
  estimatedGas: string;
  /** Whether the payment token is the chain's native coin (price + gas share one balance). */
  isNative: boolean;
}

export interface FundsStatus {
  /** No shortfall of either kind — everything looks payable. */
  sufficient: boolean;
  /** Certain: token balance is below the price. Drives a hard block. */
  tokenShortfall: boolean;
  /** Estimated: native balance can't cover gas (plus price when paying native). Soft warning. */
  gasShortfall: boolean;
}

const NEUTRAL: FundsStatus = { gasShortfall: false, sufficient: true, tokenShortfall: false };

/** Parse a human-readable decimal, returning `undefined` for empty/NaN input. */
function parseAmount(value: string): number | undefined {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function computeFundsStatus(params: FundsStatusParams): FundsStatus {
  const price = parseAmount(params.price);
  if (price === undefined)
    return NEUTRAL;

  const native = parseAmount(params.nativeBalance);
  // A missing gas estimate counts as 0 so we never raise a gas warning on data
  // that hasn't loaded yet.
  const gas = parseAmount(params.estimatedGas) ?? 0;

  if (params.isNative) {
    if (native === undefined)
      return NEUTRAL;

    const tokenShortfall = native < price;
    // Only a gas concern once the price itself is covered but price + gas isn't.
    const gasShortfall = !tokenShortfall && native < price + gas;
    return { gasShortfall, sufficient: !tokenShortfall && !gasShortfall, tokenShortfall };
  }

  const token = parseAmount(params.tokenBalance);
  if (token === undefined)
    return NEUTRAL;

  const tokenShortfall = token < price;
  // Gas is always paid in the native coin, independent of the ERC-20 balance.
  const gasShortfall = native !== undefined && native < gas;
  return { gasShortfall, sufficient: !tokenShortfall && !gasShortfall, tokenShortfall };
}
