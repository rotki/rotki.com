<script setup lang="ts">
import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { RuiButton, RuiTextField } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';
import { useDiscountCode } from '../composables/discount-code';

const code = defineModel<string>({ required: true });

const {
  discount,
  campaign,
  disabled = false,
  loading = false,
} = defineProps<{
  /** What the latest breakdown said about the code. */
  discount?: PaymentBreakdownResponse['discount'];
  /** A running campaign, offered in the hint while no code is applied. */
  campaign?: { code: string; percent: number };
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  /** The buyer applied a code, or removed one (empty string). */
  apply: [code: string];
}>();

const t = useCheckoutMessages();

const { applied, apply, canApply, error, modelInput, remove } = useDiscountCode(code, () => discount);

const hint = computed<string>(() => campaign
  ? t('checkout.discount.campaign_hint', { code: campaign.code, percent: campaign.percent })
  : t('checkout.discount.hint'));

const savings = computed<string>(() => {
  const info = get(applied);
  if (!info)
    return '';
  const amount = t('checkout.discount.you_save', { amount: info.saved.formatted });
  return info.percent ? `${amount} ${t('checkout.discount.percent_off', { percentage: info.percent })}` : amount;
});

function submit(): void {
  if (get(canApply))
    emit('apply', apply());
}

function clear(): void {
  remove();
  emit('apply', '');
}
</script>

<template>
  <form
    v-if="!applied"
    @submit.prevent="submit()"
  >
    <RuiTextField
      v-model="modelInput"
      color="primary"
      :label="t('checkout.discount.label')"
      :error-messages="error"
      :hint="error ? undefined : hint"
      :disabled="disabled || loading"
    >
      <template #prepend>
        <svg
          class="size-4 text-rui-text-secondary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
          <circle
            cx="7.5"
            cy="7.5"
            r=".5"
            fill="currentColor"
          />
        </svg>
      </template>
      <template #append>
        <RuiButton
          v-if="error"
          icon
          variant="text"
          type="button"
          :aria-label="t('checkout.discount.clear')"
          @click="clear()"
        >
          <svg
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </RuiButton>
        <RuiButton
          v-else
          type="submit"
          color="primary"
          :loading="loading"
          :disabled="!canApply || disabled || loading"
        >
          {{ t('checkout.discount.apply_code') }}
        </RuiButton>
      </template>
    </RuiTextField>
  </form>

  <div v-else>
    <div class="rounded-rui-control px-3 py-2 flex items-center justify-between border border-rui-success-border bg-rui-success-subtle">
      <div>
        <div class="flex items-center gap-1 text-xs">
          <span class="text-rui-text-secondary">
            {{ applied.isReferral ? t('checkout.discount.referral_applied') : t('checkout.discount.applied') }}
          </span>
          <span
            class="font-bold uppercase"
            data-cy="applied-code"
          >
            {{ code }}
          </span>
        </div>
        <div class="font-bold text-sm text-rui-success">
          {{ savings }}
        </div>
      </div>
      <RuiButton
        icon
        variant="text"
        type="button"
        :aria-label="t('checkout.discount.remove')"
        :disabled="disabled"
        @click="clear()"
      >
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </RuiButton>
    </div>
    <div class="text-xs text-rui-text-secondary mt-2">
      {{ t('checkout.discount.first_payment_only') }}
    </div>
  </div>
</template>
