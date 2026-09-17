import { describe, expect, it } from 'vitest';
import { consolidateSlug, integrationQualifier, integrationSlug } from '~/utils/integration-slug';

describe('integration-slug', () => {
  it('slugifies labels', () => {
    expect(integrationSlug('Aave')).toBe('aave');
    expect(integrationSlug('Makerdao DSR')).toBe('makerdao-dsr');
  });

  it('folds granular catalog entries into their canonical slug', () => {
    expect(consolidateSlug('makerdao-dsr')).toBe('makerdao');
    expect(consolidateSlug('coinbase-pro')).toBe('coinbase-pro');
  });

  it('returns the coverage qualifier for a label', () => {
    expect(integrationQualifier('Aave')).toBe('v1–v3');
    expect(integrationQualifier('Uniswap')).toBe('v2–v4');
    expect(integrationQualifier('Solana')).toBe('early support');
  });

  it('returns undefined for labels without a qualifier', () => {
    expect(integrationQualifier('Coinbase')).toBeUndefined();
  });
});
