import type { AvailablePlan } from '../schemas/plans';
import { describe, expect, it } from 'vitest';
import { findSelectedPlan, formatPlanName, parsePlanId, paymentAmounts, selectedPlanFrom } from './plan';

describe('formatPlanName', () => {
  it.each([
    ['basic', 'Basic'],
    ['ADVANCED', 'Advanced'],
    ['', ''],
  ])('shows %s as %s', (name, expected) => {
    expect(formatPlanName(name)).toBe(expected);
  });
});

const BASIC: AvailablePlan = { isCustom: false, isMostPopular: false, tierName: 'basic', monthlyPlan: { planId: 3, price: '25.00' }, yearlyPlan: { planId: 4, price: '250.00' } };
const MONTHLY_ONLY: AvailablePlan = { isCustom: false, isMostPopular: false, tierName: 'advanced', monthlyPlan: { planId: 5, price: '45.00' }, yearlyPlan: null };

describe('selectedPlanFrom', () => {
  it('builds the plan of the period', () => {
    expect(selectedPlanFrom(BASIC, false)).toEqual({ durationInMonths: 1, name: 'basic', planId: 3, price: 25 });
    expect(selectedPlanFrom(BASIC, true)).toEqual({ durationInMonths: 12, name: 'basic', planId: 4, price: 250 });
  });

  it('has nothing for a period the tier does not offer', () => {
    expect(selectedPlanFrom(MONTHLY_ONLY, true)).toBeUndefined();
  });
});

describe('findSelectedPlan', () => {
  it('finds a plan by its monthly or yearly id', () => {
    expect(findSelectedPlan([MONTHLY_ONLY, BASIC], 4)).toEqual({ durationInMonths: 12, name: 'basic', planId: 4, price: 250 });
    expect(findSelectedPlan([MONTHLY_ONLY, BASIC], 5)).toEqual({ durationInMonths: 1, name: 'advanced', planId: 5, price: 45 });
    expect(findSelectedPlan([BASIC], 99)).toBeUndefined();
  });
});

describe('parsePlanId', () => {
  it('reads a positive whole number', () => {
    expect(parsePlanId('12')).toBe(12);
  });

  it.each([['12abc'], ['0'], ['-1'], ['1.5'], [''], [undefined], [['1']]])('rejects %j', (value) => {
    expect(parsePlanId(value)).toBeUndefined();
  });
});

describe('paymentAmounts', () => {
  it('uses the plan price until the breakdown has loaded', () => {
    expect(paymentAmounts(undefined, { price: 25 })).toEqual({ finalAmount: 25, renewingPrice: 25 });
  });

  it('uses the breakdown once it is there', () => {
    expect(paymentAmounts({ finalAmount: '22.50', renewingPrice: '25.00' }, { price: 25 })).toEqual({ finalAmount: 22.5, renewingPrice: 25 });
  });
});
