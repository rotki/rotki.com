import { describe, expect, it } from 'vitest';
import { formatPlanName } from './plan';

describe('formatPlanName', () => {
  it.each([
    ['basic', 'Basic'],
    ['ADVANCED', 'Advanced'],
    ['', ''],
  ])('shows %s as %s', (name, expected) => {
    expect(formatPlanName(name)).toBe(expected);
  });
});
