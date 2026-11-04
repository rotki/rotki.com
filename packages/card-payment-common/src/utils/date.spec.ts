import { describe, expect, it } from 'vitest';
import { formatLongDate } from './date';

describe('formatLongDate', () => {
  it('writes the month out and the day without a leading zero', () => {
    expect(formatLongDate(new Date(2026, 10, 2))).toBe('November 2, 2026');
    expect(formatLongDate(new Date(2026, 0, 31))).toBe('January 31, 2026');
  });

  it('returns an empty string for an invalid date', () => {
    expect(formatLongDate(new Date('not a date'))).toBe('');
  });
});
