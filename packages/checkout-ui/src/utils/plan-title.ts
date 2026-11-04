import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CheckoutTranslate } from './translator';
import { formatPlanName } from '@rotki/card-payment-common/utils/plan';

/**
 * The plan as one line: "Basic, monthly" for a subscription, "Basic, 1 month" for a
 * one-time (crypto) payment that buys a single period.
 */
export function planTitle(t: CheckoutTranslate, plan: Pick<SelectedPlan, 'name' | 'durationInMonths'>, oneTime = false): string {
  const name = formatPlanName(plan.name);
  const yearly = plan.durationInMonths === 12;
  if (oneTime)
    return yearly ? t('checkout.plan.name_one_year', { name }) : t('checkout.plan.name_one_month', { name });
  return yearly ? t('checkout.plan.name_yearly', { name }) : t('checkout.plan.name_monthly', { name });
}
