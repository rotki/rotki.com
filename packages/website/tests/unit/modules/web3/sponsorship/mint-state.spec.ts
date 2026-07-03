import { describe, expect, it } from 'vitest';
import { NATIVE_TOKEN_ADDRESS } from '~/modules/web3/core/erc20';
import {
  buildTierPriceDisplay,
  computeNeedsApproval,
  filterAvailableTokens,
  filterVisibleTiers,
  type PriceGetter,
  resolveApprovalRequest,
  resolveMintButtonState,
} from '~/modules/web3/sponsorship/mint-state';
import { type PaymentToken, SPONSORSHIP_TIERS } from '~/modules/web3/sponsorship/types';
import { findTierByKey } from '~/modules/web3/sponsorship/utils';

function token(partial: Partial<PaymentToken> & Pick<PaymentToken, 'symbol'>): PaymentToken {
  return {
    address: '0xtoken',
    decimals: 6,
    icon: '',
    iconUrl: '',
    prices: { bronze: '10', gold: '30', silver: '20' },
    ...partial,
  };
}

// A price getter backed by a list of tokens, mirroring usePaymentTokens().getPriceForTier.
function priceGetterFor(tokens: PaymentToken[]): PriceGetter {
  return (currency, tier) => tokens.find(t => t.symbol === currency)?.prices[tier];
}

describe('filterAvailableTokens', () => {
  it('keeps tokens with at least one positive tier price', () => {
    const eth = token({ symbol: 'ETH' });
    const result = filterAvailableTokens([eth]);
    expect(result).toEqual([eth]);
  });

  it('drops tokens whose every tier price is zero or empty', () => {
    const dead = token({ prices: { bronze: '0', gold: '0', silver: '0' }, symbol: 'DEAD' });
    const live = token({ symbol: 'USDC' });
    expect(filterAvailableTokens([dead, live])).toEqual([live]);
  });

  it('drops tokens with a missing prices map', () => {
    const broken = token({ symbol: 'X' });
    // Simulate an API token that arrived without a prices map (guards the `!token.prices` branch).
    Reflect.deleteProperty(broken, 'prices');
    expect(filterAvailableTokens([broken])).toEqual([]);
  });
});

describe('filterVisibleTiers', () => {
  it('returns every tier while still loading', () => {
    const result = filterVisibleTiers('ETH', () => undefined, true);
    expect(result).toHaveLength(SPONSORSHIP_TIERS.length);
  });

  it('keeps only tiers with a positive price once loaded', () => {
    const tokens = [token({ prices: { bronze: '10', gold: '0', silver: '0' }, symbol: 'ETH' })];
    const result = filterVisibleTiers('ETH', priceGetterFor(tokens), false);
    expect(result.map(t => t.key)).toEqual(['bronze']);
  });

  it('returns an empty list when nothing is priced', () => {
    expect(filterVisibleTiers('ETH', () => '0', false)).toEqual([]);
  });
});

describe('buildTierPriceDisplay', () => {
  it('shows the loading label for every tier while loading', () => {
    const result = buildTierPriceDisplay('ETH', () => undefined, true, 'Loading…');
    expect(result).toEqual({ bronze: 'Loading…', gold: 'Loading…', silver: 'Loading…' });
  });

  it('formats "<price> <currency>" for priced tiers and "0" otherwise', () => {
    const tokens = [token({ prices: { bronze: '10', gold: '', silver: '20' }, symbol: 'USDC' })];
    const result = buildTierPriceDisplay('USDC', priceGetterFor(tokens), false, 'Loading…');
    expect(result).toEqual({ bronze: '10 USDC', gold: '0', silver: '20 USDC' });
  });

  it('drops shared trailing zeros when every tier is a whole number', () => {
    const tokens = [token({ prices: { bronze: '200.000000000', gold: '250.0', silver: '300.000000000' }, symbol: 'EURe' })];
    const result = buildTierPriceDisplay('EURe', priceGetterFor(tokens), false, 'Loading…');
    expect(result).toEqual({ bronze: '200 EURe', gold: '250 EURe', silver: '300 EURe' });
  });

  it('aligns every tier to the decimals of the most precise one', () => {
    const tokens = [token({ prices: { bronze: '200.000000', gold: '250', silver: '300.1' }, symbol: 'EURe' })];
    const result = buildTierPriceDisplay('EURe', priceGetterFor(tokens), false, 'Loading…');
    expect(result).toEqual({ bronze: '200.0 EURe', gold: '250.0 EURe', silver: '300.1 EURe' });
  });

  it('ignores unpriced tiers when computing the shared decimals', () => {
    const tokens = [token({ prices: { bronze: '200.000000', gold: '', silver: '300.000000' }, symbol: 'EURe' })];
    const result = buildTierPriceDisplay('EURe', priceGetterFor(tokens), false, 'Loading…');
    expect(result).toEqual({ bronze: '200 EURe', gold: '0', silver: '300 EURe' });
  });
});

describe('computeNeedsApproval', () => {
  const erc20 = token({ address: '0xerc20', symbol: 'USDC' });

  it('is false on the wrong chain', () => {
    expect(computeNeedsApproval({ allowance: '0', isExpectedChain: false, tierKey: 'bronze', token: erc20 })).toBe(false);
  });

  it('is false for native tokens', () => {
    const native = token({ address: NATIVE_TOKEN_ADDRESS, symbol: 'ETH' });
    expect(computeNeedsApproval({ allowance: '0', isExpectedChain: true, tierKey: 'bronze', token: native })).toBe(false);
  });

  it('is false when the token is missing', () => {
    expect(computeNeedsApproval({ allowance: '0', isExpectedChain: true, tierKey: 'bronze', token: undefined })).toBe(false);
  });

  it('is true when the allowance is below the tier price', () => {
    expect(computeNeedsApproval({ allowance: '5', isExpectedChain: true, tierKey: 'bronze', token: erc20 })).toBe(true);
  });

  it('is false when the allowance already covers the tier price', () => {
    expect(computeNeedsApproval({ allowance: '10', isExpectedChain: true, tierKey: 'bronze', token: erc20 })).toBe(false);
  });
});

describe('resolveApprovalRequest', () => {
  const tokens = [token({ address: '0xerc20', symbol: 'USDC' })];

  it('resolves the currency and tier price', () => {
    expect(resolveApprovalRequest('USDC', 'silver', tokens)).toMatchObject({ ok: true, value: { currency: 'USDC', price: '20' } });
  });

  it('errors when the token is not available', () => {
    expect(resolveApprovalRequest('DAI', 'silver', tokens)).toMatchObject({ error: expect.stringContaining('DAI'), ok: false });
  });

  it('errors when the tier has no price', () => {
    const noGold = [token({ prices: { bronze: '10', gold: '', silver: '20' }, symbol: 'USDC' })];
    expect(resolveApprovalRequest('USDC', 'gold', noGold)).toMatchObject({ error: expect.stringContaining('gold'), ok: false });
  });
});

describe('resolveMintButtonState', () => {
  function context(overrides: Partial<Parameters<typeof resolveMintButtonState>[0]> = {}) {
    return resolveMintButtonState({
      connected: true,
      currency: 'ETH',
      hasInsufficientFunds: false,
      hasVisibleTiers: true,
      isApproving: false,
      isExpectedChain: true,
      isPending: false,
      mintingEnabled: true,
      needsApproval: false,
      tier: findTierByKey('bronze'),
      tierAvailable: true,
      ...overrides,
    });
  }

  it('prompts to connect when disconnected', () => {
    const state = context({ connected: false });
    expect(state.action).toBe('connect');
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.connect_wallet');
  });

  it('prompts to switch network on the wrong chain', () => {
    const state = context({ isExpectedChain: false });
    expect(state.action).toBe('switch-network');
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.switch_network');
  });

  it('reports no tiers available', () => {
    const state = context({ hasVisibleTiers: false });
    expect(state.action).toBe('none');
    expect(state.disabled).toBe(true);
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.no_tiers_available');
  });

  it('asks to select a tier when none resolves', () => {
    const state = context({ tier: undefined });
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.select_tier');
  });

  it('reports a sold-out tier with its label', () => {
    const state = context({ tierAvailable: false });
    expect(state.action).toBe('none');
    expect(state.disabled).toBe(true);
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.sold_out');
    expect(state.textParams).toEqual({ tier: 'Bronze' });
  });

  it('shows approving state', () => {
    const state = context({ isApproving: true });
    expect(state.disabled).toBe(true);
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.approving');
  });

  it('shows the approve prompt with the currency, action handled by the menu', () => {
    const state = context({ currency: 'USDC', needsApproval: true });
    expect(state.action).toBe('none');
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.approve');
    expect(state.textParams).toEqual({ currency: 'USDC' });
  });

  it('hard-blocks with an insufficient-funds prompt when the balance is short', () => {
    const state = context({ currency: 'USDC', hasInsufficientFunds: true });
    expect(state.action).toBe('none');
    expect(state.disabled).toBe(true);
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.insufficient_funds');
    expect(state.textParams).toEqual({ currency: 'USDC' });
  });

  it('prioritises a sold-out tier over an insufficient-funds prompt', () => {
    const state = context({ hasInsufficientFunds: true, tierAvailable: false });
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.sold_out');
  });

  it('shows insufficient funds ahead of the approve prompt', () => {
    const state = context({ hasInsufficientFunds: true, needsApproval: true });
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.insufficient_funds');
  });

  it('shows minting state while a tx is pending', () => {
    const state = context({ isPending: true });
    expect(state.disabled).toBe(true);
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.minting');
  });

  it('is ready to mint in the happy path', () => {
    const state = context();
    expect(state.action).toBe('mint');
    expect(state.disabled).toBe(false);
    expect(state.textKey).toBe('sponsor.sponsor_page.buttons.mint');
    expect(state.textParams).toEqual({ tier: 'Bronze' });
  });

  it('is disabled when minting is feature-flagged off', () => {
    expect(context({ mintingEnabled: false }).disabled).toBe(true);
  });
});
