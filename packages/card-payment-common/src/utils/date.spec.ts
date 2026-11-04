import { describe, expect, it } from 'vitest';
import { formatLongDate, renewalDateFrom } from './date';

describe('formatLongDate', () => {
  it('writes the month out and the day without a leading zero', () => {
    expect(formatLongDate(new Date(2026, 10, 2))).toBe('November 2, 2026');
    expect(formatLongDate(new Date(2026, 0, 31))).toBe('January 31, 2026');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatLongDate(new Date('not a date'))).toBe('');
  });
});

describe('renewalDateFrom', () => {
  it('renews the same day a month or a year later', () => {
    const from = new Date(2026, 10, 4);

    expect(renewalDateFrom(1, from)).toEqual(new Date(2026, 11, 4));
    expect(renewalDateFrom(12, from)).toEqual(new Date(2027, 10, 4));
  });

  it('leaves the start date as it was', () => {
    const from = new Date(2026, 10, 4);
    renewalDateFrom(1, from);

    expect(from).toEqual(new Date(2026, 10, 4));
  });
});
