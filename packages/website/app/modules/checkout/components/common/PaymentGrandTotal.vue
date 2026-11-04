<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { OrderSummary } from '@rotki/card-payment-common/utils/order-summary';
import { formatDate } from '~/utils/date';

const {
  plan,
  summary,
  loading,
  crypto,
} = defineProps<{
  plan: SelectedPlan;
  summary: OrderSummary;
  loading?: boolean;
  crypto?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const hasAdjustments = computed<boolean>(() => !!summary.discount || !!summary.credit);

const durationLabel = computed<string>(() => {
  if (plan.durationInMonths === 12)
    return t('selected_plan_overview.year');
  return t('selected_plan_overview.month');
});

const renewalDate = computed<string>(() => {
  const today = new Date();
  const renewal = new Date(today);
  renewal.setMonth(renewal.getMonth() + plan.durationInMonths);
  return formatDate(renewal);
});
</script>

<template>
  <div class="pt-4">
    <!-- Discount section -->
    <div
      v-if="hasAdjustments"
      class="space-y-2 pb-3"
    >
      <!-- Original price before discount -->
      <div
        v-if="summary.discount && summary.vat.rate > 0"
        class="flex justify-between text-sm text-gray-500"
      >
        <span>{{ t('payment_grand_total.original_price') }}</span>
        <span class="line-through">
          <RuiSkeletonLoader
            v-if="loading"
            class="w-16 h-5"
          />
          <template v-else>
            {{ summary.fullAmount.formatted }}
          </template>
        </span>
      </div>

      <!-- Discount savings -->
      <div
        v-if="summary.discount"
        class="flex justify-between text-sm font-medium text-green-600"
      >
        <span>{{ t('payment_grand_total.discount_savings') }}</span>
        <span>
          <RuiSkeletonLoader
            v-if="loading"
            class="w-16 h-5"
          />
          <template v-else>
            -{{ summary.discount.saved.formatted }}
          </template>
        </span>
      </div>

      <div
        v-if="summary.credit"
        class="flex justify-between text-sm font-medium text-green-600"
      >
        <span>{{ t('payment_grand_total.credit_applied') }}</span>
        <span>
          <RuiSkeletonLoader
            v-if="loading"
            class="w-16 h-5"
          />
          <template v-else>
            -{{ summary.credit.formatted }}
          </template>
        </span>
      </div>
    </div>

    <!-- Divider between discount and total -->
    <div
      v-if="hasAdjustments"
      class="border-t border-dashed border-gray-200 my-3"
    />

    <!-- VAT breakdown -->
    <div class="space-y-1.5 pb-3">
      <!-- Subtotal -->
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">{{ t('payment_grand_total.subtotal') }}</span>
        <span class="font-medium text-rui-text">
          <RuiSkeletonLoader
            v-if="loading"
            class="w-16 h-5"
          />
          <template v-else>
            {{ summary.subtotal.formatted }}
          </template>
        </span>
      </div>

      <!-- VAT -->
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">{{ t('payment_grand_total.vat', { rate: summary.vat.formattedRate }) }}</span>
        <span class="font-medium text-rui-text">
          <RuiSkeletonLoader
            v-if="loading"
            class="w-16 h-5"
          />
          <template v-else>
            {{ summary.vat.amount.formatted }}
          </template>
        </span>
      </div>
    </div>

    <!-- Grand total with emphasis -->
    <div class="flex items-center justify-between pt-3 border-t border-gray-300">
      <span class="text-gray-800 font-semibold">
        {{ t('home.plans.tiers.step_3.grand_total') }}
      </span>
      <div class="text-2xl font-bold text-rui-primary">
        <RuiSkeletonLoader
          v-if="loading"
          class="w-24 h-8"
        />
        <template v-else>
          {{ summary.dueToday.formatted }}
        </template>
      </div>
    </div>

    <!-- Renewal info (only for card payments, not crypto) -->
    <div
      v-if="!crypto"
      class="mt-3 text-xs text-gray-500 text-right"
    >
      <i18n-t
        keypath="selected_plan_overview.next_payment"
        scope="global"
        tag="div"
      >
        <template #date>
          <span class="font-medium text-gray-700">{{ renewalDate }}</span>
        </template>
      </i18n-t>
      <div class="italic mt-1">
        {{ t('selected_plan_overview.recurring_info', { period: durationLabel }) }}
      </div>
    </div>

    <!-- Crypto one-time payment info -->
    <div
      v-else
      class="mt-3 text-xs text-gray-500 text-right italic whitespace-pre-line"
    >
      {{ t('selected_plan_overview.one_time_payment') }}
    </div>
  </div>
</template>
