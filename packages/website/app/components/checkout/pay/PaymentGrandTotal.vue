<script setup lang="ts">
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/core';

const props = defineProps<{
  plan: SelectedPlan;
  grandTotal: number;
  loading?: boolean;
  upgrade?: boolean;
  discountInfo?: DiscountInfo;
}>();

const { plan, discountInfo } = toRefs(props);

const { t } = useI18n({ useScope: 'global' });

const subtotal = computed<number>(() => get(plan).price);

const hasDiscount = computed<boolean>(() => {
  const info = get(discountInfo);
  return !!(info && info.isValid);
});

const discountAmount = computed<number>(() => {
  const info = get(discountInfo);
  return info && info.isValid ? info.discountedAmount : 0;
});
</script>

<template>
  <div>
    <!-- Subtotal (only visible if discount is applied) -->
    <div
      v-if="hasDiscount"
      class="flex items-center justify-between mb-3"
    >
      <div class="text-rui-text-secondary">
        Subtotal:
      </div>
      <div>
        <RuiSkeletonLoader
          v-if="loading"
          :loading="loading"
          class="w-20 h-6"
        >
          {{ subtotal.toFixed(2) }} €
        </RuiSkeletonLoader>
        <span v-else>
          {{ subtotal.toFixed(2) }} €
        </span>
      </div>
    </div>

    <!-- Discount (if applicable) -->
    <div
      v-if="hasDiscount"
      class="flex items-center justify-between mb-3"
    >
      <div class="text-rui-success">
        Discount:
      </div>
      <div class="text-rui-success">
        <RuiSkeletonLoader
          v-if="loading"
          :loading="loading"
          class="w-20 h-6"
        >
          -{{ discountAmount.toFixed(2) }} €
        </RuiSkeletonLoader>
        <span v-else>
          -{{ discountAmount.toFixed(2) }} €
        </span>
      </div>
    </div>

    <!-- Grand Total -->
    <div class="flex items-center justify-between py-4 border-t border-default">
      <div class="text-rui-text-secondary font-bold">
        {{ t('home.plans.tiers.step_3.grand_total') }}
      </div>
      <div class="font-bold text-xl underline">
        <RuiSkeletonLoader
          v-if="loading"
          :loading="loading"
          class="w-20 h-7"
        >
          {{ grandTotal.toFixed(2) }} €
        </RuiSkeletonLoader>
        <span v-else>
          {{ grandTotal.toFixed(2) }} €
        </span>
      </div>
    </div>

    <RuiAlert
      v-if="upgrade"
      class="mt-4"
      type="info"
    >
      {{ t('home.plans.tiers.step_3.upgrade_plan_description') }}
    </RuiAlert>
  </div>
</template>
