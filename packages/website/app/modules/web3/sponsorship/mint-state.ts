import { flatMap, fromNullable, map, type Result } from 'plainfp/result';
import { isNativeToken } from '~/modules/web3/core/erc20';
import { type PaymentToken, SPONSORSHIP_TIERS, type SponsorshipTier, type TierKey } from '~/modules/web3/sponsorship/types';

/** Reads the price of a tier for a given currency (mirrors `usePaymentTokens().getPriceForTier`). */
export type PriceGetter = (currency: string, tier: TierKey) => string | undefined;

export interface ApprovalRequest {
  currency: string;
  price: string;
}

/**
 * Resolve the token and tier price needed to approve an ERC-20 spend, short-circuiting
 * to a descriptive error on the first missing piece (functional, no exceptions).
 */
export function resolveApprovalRequest(currency: string, tierKey: TierKey, tokens: readonly PaymentToken[]): Result<ApprovalRequest, string> {
  return flatMap(
    fromNullable(tokens.find(token => token.symbol === currency), `Payment token ${currency} not available`),
    token => map(
      // Treat an empty price string as missing, matching the legacy `if (!price)` guard.
      fromNullable(token.prices?.[tierKey] || undefined, `Price not available for ${tierKey} tier in ${currency}`),
      price => ({ currency, price }),
    ),
  );
}

/** Drop tokens that have no positive price for any tier (i.e. unusable for minting). */
export function filterAvailableTokens(tokens: readonly PaymentToken[]): PaymentToken[] {
  return tokens.filter(token => !!token.prices && SPONSORSHIP_TIERS.some((tier) => {
    const price = token.prices[tier.key];
    return !!price && Number.parseFloat(price) > 0;
  }));
}

/**
 * Tiers that should be shown for the selected currency. While prices are still
 * loading every tier is shown (so the UI doesn't flicker empty); afterwards only
 * tiers with a positive price remain.
 */
export function filterVisibleTiers(currency: string, getPriceForTier: PriceGetter, isLoading: boolean): SponsorshipTier[] {
  if (isLoading)
    return [...SPONSORSHIP_TIERS];

  return SPONSORSHIP_TIERS.filter((tier) => {
    const price = getPriceForTier(currency, tier.key);
    return !!price && Number.parseFloat(price) > 0;
  });
}

/**
 * Per-tier price label for the selected currency. While loading every tier gets
 * `loadingLabel`; otherwise `"<price> <currency>"` or `"0"` when unpriced.
 */
export function buildTierPriceDisplay(currency: string, getPriceForTier: PriceGetter, isLoading: boolean, loadingLabel: string): Record<string, string> {
  const result: Record<string, string> = {};

  if (isLoading) {
    for (const tier of SPONSORSHIP_TIERS)
      result[tier.key] = loadingLabel;
    return result;
  }

  for (const tier of SPONSORSHIP_TIERS) {
    const price = getPriceForTier(currency, tier.key);
    result[tier.key] = price ? `${price} ${currency}` : '0';
  }
  return result;
}

interface NeedsApprovalParams {
  token: PaymentToken | undefined;
  tierKey: TierKey;
  allowance: string;
  isExpectedChain: boolean;
}

/**
 * Whether the selected ERC-20 token still needs an allowance bump before minting.
 * Native tokens, the wrong chain or a missing token all short-circuit to `false`.
 */
export function computeNeedsApproval({ allowance, isExpectedChain, tierKey, token }: NeedsApprovalParams): boolean {
  if (!isExpectedChain)
    return false;

  if (!token || isNativeToken(token.address))
    return false;

  const price = token.prices[tierKey];
  const allowanceNum = Number.parseFloat(allowance);
  // An allowance already at/above the price (or effectively unlimited) needs no approval.
  return !!(price && allowanceNum < Number.parseFloat(price) && allowanceNum < Number.MAX_SAFE_INTEGER);
}

/** What the primary mint button should do when clicked. */
export type MintButtonAction = 'connect' | 'switch-network' | 'none' | 'mint';

export interface MintButtonContext {
  mintingEnabled: boolean;
  connected: boolean;
  isExpectedChain: boolean;
  hasVisibleTiers: boolean;
  /** The resolved tier for the current selection, or `undefined` if none matches. */
  tier: SponsorshipTier | undefined;
  tierAvailable: boolean;
  isApproving: boolean;
  needsApproval: boolean;
  isPending: boolean;
  /** Certain token shortfall (balance < price) — hard-blocks minting. */
  hasInsufficientFunds: boolean;
  currency: string;
}

export interface MintButtonState {
  textKey: string;
  textParams?: Record<string, string>;
  action: MintButtonAction;
  disabled: boolean;
}

const BUTTON_KEY = 'sponsor.sponsor_page.buttons';

function resolveButtonAction(ctx: MintButtonContext): MintButtonAction {
  if (!ctx.connected)
    return 'connect';
  if (!ctx.isExpectedChain)
    return 'switch-network';
  if (!ctx.hasVisibleTiers || !ctx.tierAvailable || ctx.hasInsufficientFunds || ctx.needsApproval)
    return 'none';
  return 'mint';
}

function resolveButtonText(ctx: MintButtonContext): Pick<MintButtonState, 'textKey' | 'textParams'> {
  if (!ctx.connected)
    return { textKey: `${BUTTON_KEY}.connect_wallet` };
  if (!ctx.isExpectedChain)
    return { textKey: `${BUTTON_KEY}.switch_network` };
  if (!ctx.hasVisibleTiers)
    return { textKey: `${BUTTON_KEY}.no_tiers_available` };
  if (!ctx.tier)
    return { textKey: `${BUTTON_KEY}.select_tier` };
  if (!ctx.tierAvailable)
    return { textKey: `${BUTTON_KEY}.sold_out`, textParams: { tier: ctx.tier.label } };
  if (ctx.hasInsufficientFunds)
    return { textKey: `${BUTTON_KEY}.insufficient_funds`, textParams: { currency: ctx.currency } };
  if (ctx.isApproving)
    return { textKey: `${BUTTON_KEY}.approving` };
  if (ctx.needsApproval)
    return { textKey: `${BUTTON_KEY}.approve`, textParams: { currency: ctx.currency } };
  if (ctx.isPending)
    return { textKey: `${BUTTON_KEY}.minting` };
  return { textKey: `${BUTTON_KEY}.mint`, textParams: { tier: ctx.tier.label } };
}

/**
 * Single source of truth for the mint button: unifies the previously separate
 * `buttonText` / `buttonAction` / `isButtonDisabled` derivations into one state.
 */
export function resolveMintButtonState(ctx: MintButtonContext): MintButtonState {
  const disabled = !ctx.mintingEnabled || !ctx.hasVisibleTiers || ctx.isPending || ctx.isApproving || !ctx.tierAvailable || ctx.hasInsufficientFunds;
  return { action: resolveButtonAction(ctx), disabled, ...resolveButtonText(ctx) };
}
