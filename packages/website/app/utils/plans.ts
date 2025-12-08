import type { ComposerTranslation } from 'vue-i18n';
import { toTitleCase } from '~/utils/text';

export function getPlanName(t: ComposerTranslation, months: number): string {
  if (months === 1)
    return t(`home.plans.names.monthly`);
  else if (months === 12)
    return t(`home.plans.names.yearly`);

  return t(`home.plans.names.numeric`, { months });
}

export function getPlanNameFor(t: ComposerTranslation, { durationInMonths, name }: {
  durationInMonths: number;
  name: string;
}) {
  return t(`home.plans.names.plan`, {
    name: toTitleCase(name),
    period: getPlanName(t, durationInMonths),
  });
}
