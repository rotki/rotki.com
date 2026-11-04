<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { formatLongDate } from '@rotki/card-payment-common/utils/date';
import { buildOrderSummary, type OrderSummary } from '@rotki/card-payment-common/utils/order-summary';
import { RuiSkeletonLoader } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';

const {
  plan,
  breakdown,
  upgrade = false,
  loading = false,
  durationInMonths,
  renewsAt,
  oneTime = false,
} = defineProps<{
  plan: Pick<SelectedPlan, 'price'>;
  /** Payment breakdown from the API; until it loads the rows show the plan price. */
  breakdown?: PaymentBreakdownResponse;
  upgrade?: boolean;
  /** Shows placeholders instead of amounts while a new breakdown is on its way. */
  loading?: boolean;
  durationInMonths: number;
  /** When the next charge happens; the renewal line leaves the date out without it. */
  renewsAt?: Date;
  /** One-time payments (crypto) explain that they do not renew instead. */
  oneTime?: boolean;
}>();

const t = useCheckoutMessages();

const summary = computed<OrderSummary>(() => buildOrderSummary({ plan, breakdown, upgrade }));

const hasAdjustments = computed<boolean>(() => {
  const { credit, discount } = get(summary);
  return !!discount || !!credit;
});

const renewalDate = computed<string>(() => (renewsAt ? formatLongDate(renewsAt) : ''));

const recurringInfo = computed<string>(() => durationInMonths === 12
  ? t('checkout.price_rows.recurring_year')
  : t('checkout.price_rows.recurring_month'));
</script>

<template>
  <div class="pt-4">
    <div
      v-if="hasAdjustments"
      class="space-y-2 pb-3"
    >
      <div
        v-if="summary.discount && summary.vat.rate > 0"
        class="flex justify-between text-sm text-rui-text-secondary"
      >
        <span>{{ t('checkout.price_rows.original_price') }}</span>
        <RuiSkeletonLoader
          v-if="loading"
          class="w-16 h-5"
        />
        <span
          v-else
          class="line-through"
        >
          {{ summary.fullAmount.formatted }}
        </span>
      </div>

      <div
        v-if="summary.discount"
        class="flex justify-between text-sm font-medium text-rui-success"
      >
        <span>{{ t('checkout.price_rows.discount_savings') }}</span>
        <RuiSkeletonLoader
          v-if="loading"
          class="w-16 h-5"
        />
        <span v-else>-{{ summary.discount.saved.formatted }}</span>
      </div>

      <div
        v-if="summary.credit"
        class="flex justify-between text-sm font-medium text-rui-success"
      >
        <span>{{ t('checkout.price_rows.credit_applied') }}</span>
        <RuiSkeletonLoader
          v-if="loading"
          class="w-16 h-5"
        />
        <span v-else>-{{ summary.credit.formatted }}</span>
      </div>
    </div>

    <div
      v-if="hasAdjustments"
      class="border-t border-dashed border-rui-divider my-3"
    />

    <div class="space-y-1.5 pb-3">
      <div class="flex justify-between text-sm">
        <span class="text-rui-text-secondary">{{ t('checkout.price_rows.subtotal') }}</span>
        <RuiSkeletonLoader
          v-if="loading"
          class="w-16 h-5"
        />
        <span
          v-else
          class="font-medium text-rui-text"
        >
          {{ summary.subtotal.formatted }}
        </span>
      </div>

      <div class="flex justify-between text-sm">
        <span class="text-rui-text-secondary">{{ t('checkout.price_rows.vat', { rate: summary.vat.formattedRate }) }}</span>
        <RuiSkeletonLoader
          v-if="loading"
          class="w-16 h-5"
        />
        <span
          v-else
          class="font-medium text-rui-text"
        >
          {{ summary.vat.amount.formatted }}
        </span>
      </div>
    </div>

    <div class="flex items-center justify-between pt-3 border-t border-rui-divider">
      <span class="text-rui-text font-semibold">{{ t('checkout.price_rows.grand_total') }}</span>
      <RuiSkeletonLoader
        v-if="loading"
        class="w-24 h-8"
      />
      <span
        v-else
        class="text-2xl font-bold text-rui-primary"
        data-cy="grand-total"
      >
        {{ summary.dueToday.formatted }}
      </span>
    </div>

    <div
      v-if="oneTime"
      class="mt-3 text-xs text-rui-text-secondary text-right italic whitespace-pre-line"
    >
      {{ t('checkout.price_rows.one_time') }}
    </div>
    <div
      v-else
      class="mt-3 text-xs text-rui-text-secondary text-right"
    >
      <div v-if="renewalDate">
        {{ t('checkout.price_rows.renews_on') }}
        <span class="font-medium text-rui-text">{{ renewalDate }}</span>
      </div>
      <div class="italic mt-1">
        {{ recurringInfo }}
      </div>
    </div>
  </div>
</template>
