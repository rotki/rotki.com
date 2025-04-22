export function getPlanName(months: number) {
  const { $i18n } = useNuxtApp();
  const t = $i18n.t;

  if (months === 1)
    return t(`home.plans.names.monthly`);
  else if (months === 12)
    return t(`home.plans.names.yearly`);

  return t(`home.plans.names.numeric`, { months });
}

export function getPlanNameFor({ durationInMonths, name }: {
  durationInMonths: number;
  name: string;
}) {
  const { $i18n } = useNuxtApp();
  const t = $i18n.t;

  return t(`home.plans.names.plan`, {
    name: toTitleCase(name),
    period: getPlanName(durationInMonths),
  });
}
