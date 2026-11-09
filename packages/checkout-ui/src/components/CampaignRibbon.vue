<script setup lang="ts">
import { formatCampaignLastDay } from '@rotki/card-payment-common/utils/campaign';
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';

const { campaign, applied = false } = defineProps<{
  campaign: { code: string; percent: number; periodEnd?: string };
  /** The campaign code is already applied to this checkout. */
  applied?: boolean;
}>();

/** Stands in for the code, so the message can be split around it to emphasize the code. */
const CODE_MARK = '{code}';

const t = useCheckoutMessages();

const parts = computed<string[]>(() => {
  const params = { code: CODE_MARK, percent: campaign.percent };
  const message = applied ? t('checkout.campaign.applied', params) : t('checkout.campaign.offer', params);
  return message.split(CODE_MARK);
});

const lastDay = computed<string | undefined>(() => (applied ? undefined : formatCampaignLastDay(campaign.periodEnd)));
</script>

<template>
  <div
    class="flex items-center justify-center gap-2 px-4 py-2 text-sm text-rui-primary text-center font-medium border-b border-rui-divider w-full bg-rui-primary/6"
    data-cy="campaign-ribbon"
  >
    <svg
      class="size-4 shrink-0 hidden sm:block"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <template v-if="applied">
        <circle
          cx="12"
          cy="12"
          r="10"
        />
        <path d="m9 12 2 2 4-4" />
      </template>
      <template v-else>
        <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
        <circle
          cx="7.5"
          cy="7.5"
          r=".5"
          fill="currentColor"
        />
      </template>
    </svg>
    <span>
      {{ parts[0] }}<strong class="font-bold tracking-wide">{{ campaign.code }}</strong>{{ parts[1] }}
      <template v-if="lastDay">
        {{ t('checkout.campaign.last_day', { date: lastDay }) }}
      </template>
    </span>
  </div>
</template>
