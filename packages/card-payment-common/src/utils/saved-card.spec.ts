import { describe, expect, it } from 'vitest';
import { findVaultBin, isCardExpired } from './saved-card';

describe('isCardExpired', () => {
  const now = new Date(2026, 10, 15);

  it.each([
    ['this month', '11/2026', false],
    ['this month with a short year', '11/26', false],
    ['a later month', '12/2026', false],
    ['a later year', '01/2027', false],
    ['last month', '10/2026', true],
    ['last year', '12/2025', true],
    ['an expiry it cannot read', 'soon', true],
  ])('reads %s', (_, expiresAt, expired) => {
    expect(isCardExpired(expiresAt, now)).toBe(expired);
  });
});

describe('findVaultBin', () => {
  const visa = { type: 'CreditCard', details: { bin: '411111', expirationMonth: '12', expirationYear: '2030', lastFour: '1111' } };
  const other = { type: 'CreditCard', details: { bin: '555555', expirationMonth: '01', expirationYear: '2028', lastFour: '1111' } };

  it('finds the card by its last four digits', () => {
    const methods = [{ type: 'PayPalAccount', details: { email: 'a@example.com' } }, visa];

    expect(findVaultBin(methods, '1111', '12/30')).toBe('411111');
  });

  it('separates two cards sharing the last four digits by their expiry', () => {
    expect(findVaultBin([other, visa], '1111', '12/2030')).toBe('411111');
    expect(findVaultBin([visa, other], '1111', '01/28')).toBe('555555');
  });

  it('falls back to the first match when no expiry fits', () => {
    expect(findVaultBin([visa, other], '1111', '06/29')).toBe('411111');
  });

  it('returns nothing without a matching card or without a BIN', () => {
    expect(findVaultBin([visa], '4444', '12/30')).toBeUndefined();
    expect(findVaultBin([{ type: 'CreditCard', details: { lastFour: '1111' } }], '1111', '12/30')).toBeUndefined();
  });
});
