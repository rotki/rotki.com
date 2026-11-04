<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { formatLongDate } from '@rotki/card-payment-common/utils/date';
import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';

const { plan, upgrade = false, oneTime = false, startsAt } = defineProps<{
  plan: Pick<SelectedPlan, 'name' | 'durationInMonths'>;
  upgrade?: boolean;
  /** One-time payments (crypto) are paid once for the period and have no start of a subscription. */
  oneTime?: boolean;
  /** When the subscription starts; the line is left out without it. */
  startsAt?: Date;
}>();

defineSlots<{
  /** Next to the plan name, e.g. a button to change the plan. */
  action?: () => any;
}>();

const t = useCheckoutMessages();

const yearly = computed<boolean>(() => plan.durationInMonths === 12);

const title = computed<string>(() => {
  const name = plan.name.charAt(0).toUpperCase() + plan.name.slice(1).toLowerCase();
  return get(yearly) ? t('checkout.plan.name_yearly', { name }) : t('checkout.plan.name_monthly', { name });
});

const period = computed<string>(() => {
  if (oneTime)
    return get(yearly) ? t('checkout.plan.one_time_year') : t('checkout.plan.one_time_month');
  return get(yearly) ? t('checkout.plan.recurring_year') : t('checkout.plan.recurring_month');
});

const starts = computed<string>(() => (startsAt && !oneTime ? t('checkout.plan.starts', { date: formatLongDate(startsAt) }) : ''));
</script>

<template>
  <div class="flex items-start justify-between gap-4">
    <div class="min-w-0">
      <div class="flex items-center gap-2">
        <span
          class="font-medium text-rui-text"
          data-cy="plan-name"
        >
          {{ title }}
        </span>
        <span
          v-if="upgrade"
          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-rui-primary-soft text-rui-primary rounded-full"
        >
          <svg
            aria-hidden="true"
            class="size-3"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 19V5m-7 7 7-7 7 7" />
          </svg>
          {{ t('checkout.plan.upgrade') }}
        </span>
      </div>
      <p class="text-sm text-rui-text-secondary">
        {{ period }}
      </p>
      <p
        v-if="starts"
        class="text-sm text-rui-text-secondary"
      >
        {{ starts }}
      </p>
    </div>
    <slot name="action" />
  </div>
</template>
