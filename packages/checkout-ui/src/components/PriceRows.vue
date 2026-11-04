<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { formatLongDate } from '@rotki/card-payment-common/utils/date';
import { buildOrderSummary, type OrderSummary } from '@rotki/card-payment-common/utils/order-summary';
import { RuiSkeletonLoader } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';

interface PriceRow {
  id: string;
  label: string;
  value: string;
  /** Takes money off the subtotal, shown as a saving. */
  deduction?: boolean;
  /** For information only, not part of the sum (the VAT already in the price). */
  info?: boolean;
}

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

function discountLabel({ isReferral, percent }: NonNullable<OrderSummary['discount']>): string {
  if (isReferral)
    return percent ? t('checkout.price_rows.referral_percent', { percent }) : t('checkout.price_rows.referral');
  return percent ? t('checkout.price_rows.discount_percent', { percent }) : t('checkout.price_rows.discount');
}

/** Subtotal, then what comes off it, then the VAT the amount due already contains. */
const rows = computed<PriceRow[]>(() => {
  const { credit, discount, prorated, subtotal, vat } = get(summary);
  const result: PriceRow[] = [{
    id: 'subtotal',
    label: prorated ? t('checkout.price_rows.prorated_subtotal') : t('checkout.price_rows.subtotal'),
    value: subtotal.formatted,
  }];
  if (discount)
    result.push({ id: 'discount', label: discountLabel(discount), value: `−${discount.saved.formatted}`, deduction: true });
  if (credit)
    result.push({ id: 'credit', label: t('checkout.price_rows.credit'), value: `−${credit.formatted}`, deduction: true });
  if (vat)
    result.push({ id: 'vat', label: t('checkout.price_rows.vat_included', { rate: vat.formattedRate }), value: vat.amount.formatted, info: true });
  return result;
});

const nextPayment = computed<string>(() => {
  const date = renewsAt ? formatLongDate(renewsAt) : '';
  if (oneTime)
    return date ? t('checkout.price_rows.one_time', { date }) : t('checkout.price_rows.one_time_no_date');

  const amount = get(summary).renewal.formatted;
  if (durationInMonths === 12)
    return date ? t('checkout.price_rows.renews_year', { amount, date }) : t('checkout.price_rows.renews_year_no_date', { amount });
  return date ? t('checkout.price_rows.renews_month', { amount, date }) : t('checkout.price_rows.renews_month_no_date', { amount });
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
      <template
        v-for="row in rows"
        :key="row.id"
      >
        <dt
          :class="row.deduction ? 'text-rui-success' : 'text-rui-text-secondary'"
          :data-cy="`price-row-${row.id}`"
        >
          {{ row.label }}
        </dt>
        <dd
          class="text-right tabular-nums"
          :class="{
            'text-rui-success': row.deduction,
            'text-rui-text-secondary': row.info,
            'text-rui-text': !row.deduction && !row.info,
          }"
        >
          <RuiSkeletonLoader
            v-if="loading"
            class="w-16 h-5 ml-auto"
          />
          <template v-else>
            {{ row.value }}
          </template>
        </dd>
      </template>
    </dl>

    <div class="flex items-baseline justify-between pt-3 border-t border-rui-divider">
      <span class="font-medium text-rui-text">{{ t('checkout.price_rows.due_today') }}</span>
      <RuiSkeletonLoader
        v-if="loading"
        class="w-24 h-8"
      />
      <span
        v-else
        class="text-2xl font-semibold text-rui-primary-darker tabular-nums"
        data-cy="grand-total"
      >
        {{ summary.dueToday.formatted }}
      </span>
    </div>

    <p
      class="text-sm text-rui-text-secondary"
      data-cy="next-payment"
    >
      {{ nextPayment }}
    </p>
    <p
      v-if="summary.prorated"
      class="text-sm text-rui-text-secondary"
    >
      {{ t('checkout.price_rows.proration_note') }}
    </p>
  </div>
</template>
