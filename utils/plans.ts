export const getPlanName = (months: number) => {
  const { t } = useI18n();
  if (months === 1 || months === 12) {
    return t(`home.plans.names.${months}`);
  }

  return t(`home.plans.names.numeric`, { months });
};

export const getPlanSelectionName = (months: number) => {
  const { t } = useI18n();

  return t(`home.plans.names.for`, { name: getPlanName(months) });
};

export const getPlanNameFor = (months: number) => {
  const { t } = useI18n();

  return t(`home.plans.names.plan`, { name: getPlanName(months) });
};
