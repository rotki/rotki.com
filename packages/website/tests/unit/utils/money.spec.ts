import { describe, expect, it } from 'vitest';
import { discountAmount } from '~/utils/money';

describe('utils/money.ts - discountAmount', () => {
  it('handles integer minus decimal without rounding errors', () => {
    expect(discountAmount(49, 19.99)).toBe('29.01');
  });

  it('handles near-equality producing a cent', () => {
    expect(discountAmount(50, 49.99)).toBe('0.01');
  });

  it('returns 0.00 when values are equal', () => {
    expect(discountAmount(19.99, 19.99)).toBe('0.00');
  });

  it('supports negative result (more paid than original)', () => {
    expect(discountAmount(19.99, 20)).toBe('-0.01');
  });

  it('normalizes negative zero to 0.00', () => {
    // Force a case that could create -0 due to integer math symmetry (unlikely here, but test normalization)
    expect(discountAmount(0, 0)).toBe('0.00');
  });
});
