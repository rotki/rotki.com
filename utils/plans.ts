import type { SelectedPlan } from '~/types';

export function getPlanName(months: number) {
  const { t } = useI18n();
  if (months === 1)
    return t(`home.plans.names.monthly`);
  else if (months === 12)
    return t(`home.plans.names.yearly`);

  return t(`home.plans.names.numeric`, { months });
}

export function getPlanNameFor({ durationInMonths, name, price }: SelectedPlan) {
  const { t } = useI18n();

  return t(`home.plans.names.plan`, {
    name: toTitleCase(name),
    period: getPlanName(durationInMonths),
    price: price.toFixed(2),
  });
}
