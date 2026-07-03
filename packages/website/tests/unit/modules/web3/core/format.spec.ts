import { describe, expect, it } from 'vitest';
import { alignAmounts, alignmentDecimals, formatTokenBalance, significantDecimals, toFixedDecimals, truncateAddress } from '~/modules/web3/core/format';

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

  describe('significantDecimals', () => {
    it('is 0 for an integer without a decimal point', () => {
      expect(significantDecimals('200')).toBe(0);
    });

    it('is 0 when every fractional digit is a trailing zero', () => {
      expect(significantDecimals('200.000000000')).toBe(0);
    });

    it('counts only up to the last non-zero digit', () => {
      expect(significantDecimals('300.10000000')).toBe(1);
    });

    it('caps at maxDecimals', () => {
      expect(significantDecimals('0.188476330975533262')).toBe(6);
    });

    it('honours a custom cap', () => {
      expect(significantDecimals('0.123456789', 2)).toBe(2);
    });
  });

  describe('alignmentDecimals', () => {
    it('is 0 when all values are whole', () => {
      expect(alignmentDecimals(['200.000000000', '300.000000000', '250'])).toBe(0);
    });

    it('takes the max any single value needs', () => {
      expect(alignmentDecimals(['200.000000', '300.1', '250'])).toBe(1);
    });

    it('is 0 for an empty set', () => {
      expect(alignmentDecimals([])).toBe(0);
    });
  });

  describe('toFixedDecimals', () => {
    it('drops the decimal point entirely at 0 decimals', () => {
      expect(toFixedDecimals('300.10000000', 0)).toBe('300');
    });

    it('pads an integer with trailing zeros', () => {
      expect(toFixedDecimals('200', 1)).toBe('200.0');
    });

    it('truncates extra digits without rounding', () => {
      expect(toFixedDecimals('300.16', 1)).toBe('300.1');
    });

    it('keeps the integer part exact for large values', () => {
      expect(toFixedDecimals('123456789', 2)).toBe('123456789.00');
    });
  });

  describe('alignAmounts', () => {
    it('trims shared trailing zeros to whole numbers', () => {
      expect(alignAmounts(['200.000000000', '300.000000000'])).toEqual(['200', '300']);
    });

    it('pads every value once one needs a decimal', () => {
      expect(alignAmounts(['200.000000', '300.1'])).toEqual(['200.0', '300.1']);
    });

    it('aligns to the widest fractional value, capped at maxDecimals', () => {
      expect(alignAmounts(['1', '0.188476330975533262'])).toEqual(['1.000000', '0.188476']);
    });

    it('returns an empty list unchanged', () => {
      expect(alignAmounts([])).toEqual([]);
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
