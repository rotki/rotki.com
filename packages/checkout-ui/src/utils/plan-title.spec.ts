import { describe, expect, it } from 'vitest';
import { checkoutMessages } from '../messages/en';
import { planTitle } from './plan-title';
import { createTranslator } from './translator';

const t = createTranslator(checkoutMessages);

describe('planTitle', () => {
  it.each([
    [1, false, 'Basic, monthly'],
    [12, false, 'Basic, yearly'],
    [1, true, 'Basic, 1 month'],
    [12, true, 'Basic, 12 months'],
  ])('names a %s month plan (one-time: %s) as %s', (durationInMonths, oneTime, expected) => {
    expect(planTitle(t, { name: 'basic', durationInMonths }, oneTime)).toBe(expected);
  });
});
