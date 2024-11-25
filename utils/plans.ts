export function getPlanName(months: number) {
  const { t } = useI18n();
  if (months === 1)
    return t(`home.plans.names.monthly`);
  else if (months === 12)
    return t(`home.plans.names.yearly`);

  return t(`home.plans.names.numeric`, { months });
}

export function getPlanSelectionName(months: number) {
  const { t } = useI18n();

  return t(`home.plans.names.for`, { name: getPlanName(months) });
}

export function getPlanNameFor(months: number) {
  const { t } = useI18n();

  return t(`home.plans.names.plan`, { name: getPlanName(months) });
}
