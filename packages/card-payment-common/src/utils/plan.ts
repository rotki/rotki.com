import type { AvailablePlan, PaymentBreakdownResponse, SelectedPlan } from '../schemas/plans';

/** A plan name as the checkout shows it: "basic" or "BASIC" becomes "Basic". */
export function formatPlanName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/** The plan of a tier for a billing period, as the checkout passes it around; `undefined` if the tier has none. */
export function selectedPlanFrom(tier: AvailablePlan, yearly: boolean): SelectedPlan | undefined {
  const priced = yearly ? tier.yearlyPlan : tier.monthlyPlan;
  if (!priced)
    return undefined;
  return {
    planId: priced.planId,
    name: tier.tierName,
    price: Number.parseFloat(priced.price),
    durationInMonths: yearly ? 12 : 1,
  };
}

/** Finds a plan by its monthly or yearly id. */
export function findSelectedPlan(tiers: readonly AvailablePlan[], planId: number): SelectedPlan | undefined {
  for (const tier of tiers) {
    if (tier.monthlyPlan?.planId === planId)
      return selectedPlanFrom(tier, false);
    if (tier.yearlyPlan?.planId === planId)
      return selectedPlanFrom(tier, true);
  }
  return undefined;
}

/** A plan id from a URL: `undefined` unless the whole value is a positive whole number, so `12abc` is no id. */
export function parsePlanId(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value))
    return undefined;
  return Number(value);
}

/** What the buyer pays today and on renewal; the plan price until the breakdown has loaded. */
export function paymentAmounts(
  breakdown: Pick<PaymentBreakdownResponse, 'finalAmount' | 'renewingPrice'> | undefined,
  plan: Pick<SelectedPlan, 'price'>,
): { finalAmount: number; renewingPrice: number } {
  if (!breakdown)
    return { finalAmount: plan.price, renewingPrice: plan.price };
  return {
    finalAmount: Number.parseFloat(breakdown.finalAmount),
    renewingPrice: Number.parseFloat(breakdown.renewingPrice),
  };
}
