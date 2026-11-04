import { describe, expect, it } from 'vitest';
import { discountAmount, formatEur, formatPercent, fromCents, toCents } from './money';

describe('toCents', () => {
  it('should convert numbers and API strings to integer cents', () => {
    expect(toCents(25)).toBe(2500);
    expect(toCents('25.00')).toBe(2500);
    expect(toCents('19.99')).toBe(1999);
    expect(toCents(' 4.5 ')).toBe(450);
  });

  it('should round half away from zero on the written decimal value', () => {
    expect(toCents(3.585)).toBe(359);
    expect(toCents(1.005)).toBe(101);
    expect(toCents('1.005')).toBe(101);
    expect(toCents(-1.005)).toBe(-101);
    expect(toCents(0.004)).toBe(0);
  });

  it('should never return -0', () => {
    expect(Object.is(toCents(-0), 0)).toBe(true);
    expect(Object.is(toCents(-0.004), 0)).toBe(true);
  });

  it('should handle values written in exponent form', () => {
    expect(toCents(1e-7)).toBe(0);
    expect(toCents(1e21)).toBe(1e23);
  });

  it('should return NaN for values that are not numbers', () => {
    expect(toCents('')).toBeNaN();
    expect(toCents('abc')).toBeNaN();
    expect(toCents(Number.NaN)).toBeNaN();
    expect(toCents(Number.POSITIVE_INFINITY)).toBeNaN();
  });
});

describe('fromCents', () => {
  it('should convert cents back to EUR', () => {
    expect(fromCents(2999)).toBe(29.99);
    expect(fromCents(0)).toBe(0);
  });

  it('should never return -0', () => {
    expect(Object.is(fromCents(-0), 0)).toBe(true);
  });
});

describe('formatEur', () => {
  it('should format with two decimals and a space before the euro sign', () => {
    expect(formatEur(25)).toBe('25.00 €');
    expect(formatEur(29.75)).toBe('29.75 €');
    expect(formatEur(0)).toBe('0.00 €');
  });

  it('should accept the string amounts the API returns', () => {
    expect(formatEur('25.00')).toBe('25.00 €');
    expect(formatEur('3.99')).toBe('3.99 €');
    expect(formatEur('5')).toBe('5.00 €');
  });

  it('should group thousands', () => {
    expect(formatEur(1234.5)).toBe('1,234.50 €');
    expect(formatEur('1000000')).toBe('1,000,000.00 €');
  });

  it('should round to cents', () => {
    expect(formatEur(3.585)).toBe('3.59 €');
    expect(formatEur(20.833333)).toBe('20.83 €');
    expect(formatEur(250 / 12)).toBe('20.83 €');
  });

  it('should normalise negative zero', () => {
    expect(formatEur(-0)).toBe('0.00 €');
    expect(formatEur('-0.00')).toBe('0.00 €');
    expect(formatEur(-0.001)).toBe('0.00 €');
  });

  it('should keep the sign of negative amounts', () => {
    expect(formatEur(-5)).toBe('-5.00 €');
  });

  it('should return an empty string for values that are not numbers', () => {
    expect(formatEur('')).toBe('');
    expect(formatEur('n/a')).toBe('');
    expect(formatEur(Number.NaN)).toBe('');
  });
});

describe('formatPercent', () => {
  it('should drop trailing zeros', () => {
    expect(formatPercent(10)).toBe('10%');
    expect(formatPercent('10.00')).toBe('10%');
    expect(formatPercent('12.50')).toBe('12.5%');
    expect(formatPercent(19)).toBe('19%');
  });

  it('should keep up to two decimals', () => {
    expect(formatPercent(25.5)).toBe('25.5%');
    expect(formatPercent(8.125)).toBe('8.13%');
    expect(formatPercent(7.000000000000001)).toBe('7%');
  });

  it('should normalise zero', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(-0)).toBe('0%');
    expect(formatPercent(-0.001)).toBe('0%');
  });

  it('should return an empty string for values that are not numbers', () => {
    expect(formatPercent('')).toBe('');
    expect(formatPercent('abc')).toBe('');
  });
});

describe('discountAmount', () => {
  it('should calculate the difference in cents', () => {
    expect(discountAmount(49, 19.99)).toBe(29.01);
    expect(discountAmount(50, 49.99)).toBe(0.01);
    expect(discountAmount('25.00', '22.50')).toBe(2.5);
  });

  it('should return 0, not -0, when both amounts match', () => {
    expect(Object.is(discountAmount(19.99, 19.99), 0)).toBe(true);
    expect(Object.is(discountAmount(0, 0), 0)).toBe(true);
  });

  it('should go negative when the paid amount is higher', () => {
    expect(discountAmount(19.99, 20)).toBe(-0.01);
  });
});
