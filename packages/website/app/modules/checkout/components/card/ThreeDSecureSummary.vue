<script setup lang="ts">
import type { ThreeDSecureParams } from '@rotki/card-payment-common/schemas/three-d-secure';
import { formatLongDate } from '@rotki/card-payment-common/utils/date';
import { formatEur } from '@rotki/card-payment-common/utils/money';
import PlanLine from '@rotki/checkout-ui/components/PlanLine.vue';

const { payment } = defineProps<{
  payment: Pick<ThreeDSecureParams, 'planName' | 'durationInMonths' | 'finalAmount' | 'renewingPrice' | 'upgradeSubId'>;
}>();

const { t } = useI18n({ useScope: 'global' });

const plan = computed<{ name: string; durationInMonths: number } | undefined>(() =>
  payment.planName ? { name: payment.planName, durationInMonths: payment.durationInMonths } : undefined,
);

/** An upgrade keeps its subscription's billing date, which this page does not know. */
const renewal = computed<string>(() => {
  const amount = formatEur(payment.renewingPrice);
  const yearly = payment.durationInMonths === 12;
  if (payment.upgradeSubId) {
    return yearly
      ? t('subscription.3d_secure.summary.renews_yearly', { amount })
      : t('subscription.3d_secure.summary.renews_monthly', { amount });
  }
  const renewsAt = new Date();
  renewsAt.setMonth(renewsAt.getMonth() + payment.durationInMonths);
  const date = formatLongDate(renewsAt);
  return yearly
    ? t('subscription.3d_secure.summary.renews_yearly_from', { amount, date })
    : t('subscription.3d_secure.summary.renews_monthly_from', { amount, date });
});
</script>

<template>
  <div
    class="flex flex-col gap-3"
    data-cy="three-d-secure-summary"
  >
    <h2 class="text-lg md:text-xl font-semibold text-rui-text">
      {{ t('subscription.3d_secure.summary.title') }}
    </h2>
    <div
      class="text-[1.75rem] leading-9 font-semibold text-rui-primary-darker tabular-nums"
      data-cy="three-d-secure-amount"
    >
      {{ formatEur(payment.finalAmount) }}
    </div>
    <PlanLine
      v-if="plan"
      :plan="plan"
      :upgrade="!!payment.upgradeSubId"
    />
    <p class="text-sm text-rui-text-secondary">
      {{ renewal }}
    </p>
    <p class="text-sm text-rui-text-secondary pt-3 border-t border-rui-divider">
      {{ t('subscription.3d_secure.summary.note') }}
    </p>
  </div>
</template>
