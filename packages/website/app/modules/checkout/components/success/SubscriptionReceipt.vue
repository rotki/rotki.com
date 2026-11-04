<script setup lang="ts">
import type { PaymentReceipt } from '~/modules/checkout/utils/payment-receipt';
import { formatLongDate } from '@rotki/card-payment-common/utils/date';
import { formatEur } from '@rotki/card-payment-common/utils/money';
import { get } from '@vueuse/shared';

const { receipt } = defineProps<{
  receipt: PaymentReceipt;
}>();

const { t } = useI18n({ useScope: 'global' });

const plan = computed<string | undefined>(() => {
  if (!receipt.planName)
    return undefined;
  const name = receipt.planName.charAt(0).toUpperCase() + receipt.planName.slice(1).toLowerCase();
  const yearly = receipt.durationInMonths === 12;
  // Crypto pays once for the period, so it names the period instead of a billing cycle.
  if (receipt.method === 'crypto')
    return yearly ? t('checkout.plan.name_one_year', { name }) : t('checkout.plan.name_one_month', { name });
  return yearly ? t('checkout.plan.name_yearly', { name }) : t('checkout.plan.name_monthly', { name });
});

const method = computed<string>(() => ({
  card: t('subscription.success.summary.method.card'),
  paypal: t('subscription.success.summary.method.paypal'),
  crypto: t('subscription.success.summary.method.crypto'),
})[receipt.method]);

/** Crypto does not renew, and an upgrade keeps its subscription's billing date, which is not known here. */
const nextPayment = computed<string | undefined>(() => {
  if (receipt.method === 'crypto' || receipt.upgrade || !receipt.renewingPrice)
    return undefined;
  const date = new Date();
  date.setMonth(date.getMonth() + receipt.durationInMonths);
  return t('subscription.success.summary.next_payment_value', { amount: formatEur(receipt.renewingPrice), date: formatLongDate(date) });
});

interface ReceiptRow { id: string; label: string; value: string }

const rows = computed<ReceiptRow[]>(() => {
  const list: ReceiptRow[] = [];
  const planName = get(plan);
  if (planName)
    list.push({ id: 'plan', label: t('subscription.success.summary.plan'), value: planName });
  if (receipt.paid)
    list.push({ id: 'paid', label: t('subscription.success.summary.paid_today'), value: formatEur(receipt.paid) });
  const next = get(nextPayment);
  if (next)
    list.push({ id: 'next-payment', label: t('subscription.success.summary.next_payment'), value: next });
  list.push({ id: 'method', label: t('subscription.success.summary.paid_with'), value: get(method) });
  return list;
});
</script>

<template>
  <div
    class="flex flex-col gap-4"
    data-cy="subscription-receipt"
  >
    <h2 class="text-lg md:text-xl font-semibold text-rui-text">
      {{ t('subscription.success.summary.title') }}
    </h2>
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5">
      <template
        v-for="row in rows"
        :key="row.id"
      >
        <dt class="text-rui-text-secondary">
          {{ row.label }}
        </dt>
        <dd
          class="text-right text-rui-text tabular-nums whitespace-nowrap"
          :data-cy="`receipt-${row.id}`"
        >
          {{ row.value }}
        </dd>
      </template>
    </dl>
  </div>
</template>
