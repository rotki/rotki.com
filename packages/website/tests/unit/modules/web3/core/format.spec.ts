import { describe, expect, it } from 'vitest';
import { formatTokenBalance, truncateAddress } from '~/modules/web3/core/format';

describe('web3 core/format', () => {
  describe('formatTokenBalance', () => {
    it('trims to six fractional digits by default', () => {
      expect(formatTokenBalance('0.188476330975533262')).toBe('0.188476');
    });

    it('drops trailing zeros within the kept digits', () => {
      expect(formatTokenBalance('1.250000')).toBe('1.25');
    });

    it('returns the whole part when the fraction rounds away to nothing', () => {
      expect(formatTokenBalance('5.0000001')).toBe('5');
    });

    it('leaves integers (no decimal point) untouched', () => {
      expect(formatTokenBalance('42')).toBe('42');
    });

    it('keeps the integer part exact for large balances', () => {
      expect(formatTokenBalance('123456789.987654321')).toBe('123456789.987654');
    });

    it('honours a custom precision', () => {
      expect(formatTokenBalance('0.123456789', 2)).toBe('0.12');
    });

    it('returns an empty string unchanged', () => {
      expect(formatTokenBalance('')).toBe('');
    });
  });

  describe('truncateAddress', () => {
    it('truncates a 0x address keeping the prefix plus head and tail', () => {
      expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678'))
        .toBe('0x1234...5678');
    });

    it('honours a custom truncation length', () => {
      expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678', 8))
        .toBe('0x12345678...12345678');
    });

    it('leaves short strings untouched', () => {
      expect(truncateAddress('0x1234')).toBe('0x1234');
    });

    it('works without a 0x prefix', () => {
      expect(truncateAddress('abcdefghijklmnop')).toBe('abcd...mnop');
    });
  });
});
