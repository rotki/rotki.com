<script setup lang="ts">
import type { PaymentBreakdownDiscount, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set } from '@vueuse/core';

const model = defineModel<string>({ required: true });

const props = defineProps<{
  plan: SelectedPlan;
  crypto?: boolean;
  disabled?: boolean;
  discountInfo?: PaymentBreakdownDiscount;
}>();

const { disabled, discountInfo } = toRefs(props);

const value = ref<string>('');

const { t } = useI18n({ useScope: 'global' });

// Check if discount is applied and valid
const isApplied = computed<boolean>(() => {
  const info = get(discountInfo);
  return !!info && info.isValid;
});

// Get error message if discount is invalid
const errorMessage = computed<string | undefined>(() => {
  const info = get(discountInfo);
  if (info && !info.isValid) {
    return info.error;
  }
  return undefined;
});

// Sync internal value with model
watchImmediate(model, (modelValue: string) => {
  set(value, modelValue);
});

function apply(): void {
  // Set model to trigger parent to refetch breakdown with discount code
  set(model, get(value));
}

function reset(): void {
  set(value, '');
  set(model, '');
}
</script>

<template>
  <form
    v-if="!isApplied"
    @submit.prevent="apply()"
  >
    <RuiTextField
      v-model="value"
      color="primary"
      variant="outlined"
      :label="t('home.plans.tiers.step_3.discount.label')"
      :error-messages="errorMessage"
      :hint="t('home.plans.tiers.step_3.discount.hint')"
      :disabled="disabled"
      prepend-icon="lu-tag"
    >
      <template #append>
        <RuiButton
          type="submit"
          color="primary"
          :disabled="!value || disabled"
          @click="apply()"
        >
          {{ t('home.plans.tiers.step_3.discount.apply_code') }}
        </RuiButton>
      </template>
    </RuiTextField>
  </form>

  <div v-else-if="discountInfo && discountInfo.isValid">
    <div
      class="rounded-md px-3 h-14 flex items-center justify-between border border-rui-success"
    >
      <div>
        <div class="flex items-center gap-1">
          <div class="text-xs text-rui-text-secondary">
            {{ discountInfo.isReferral ? t('home.plans.tiers.step_3.discount.referral_applied') : t('home.plans.tiers.step_3.discount.applied') }}
          </div>
          <div class="text-xs font-bold uppercase">
            {{ model }}
          </div>
        </div>
        <div class="flex gap-1 font-bold text-sm text-rui-primary">
          <div class="text-rui-success">
            {{ t('home.plans.tiers.step_3.discount.you_save', { amount: discountInfo.discountedAmount }) }}
            <template v-if="discountInfo.discountType.includes('Percentage')">
              {{
                t('home.plans.tiers.step_3.discount.percent_off', {
                  percentage: discountInfo.discountAmount,
                })
              }}
            </template>
          </div>
        </div>
      </div>
      <RuiButton
        icon
        variant="text"
        @click="reset()"
      >
        <RuiIcon name="lu-x" />
      </RuiButton>
    </div>
    <div class="text-xs text-rui-text-secondary mt-2">
      {{ t('home.plans.tiers.step_3.discount.first_payment_only') }}
    </div>
  </div>
</template>
