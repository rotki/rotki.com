<script setup lang="ts">
import type { PaymentInfo } from '@rotki/card-payment-common/schemas/three-d-secure';
import { get } from '@vueuse/core';

interface Props {
  paymentInfo: PaymentInfo;
}

const { paymentInfo } = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });

const isYearlyPayment = computed<boolean>(() => {
  if (!paymentInfo?.durationInMonths)
    return false;

  return Number.parseInt(paymentInfo.durationInMonths) === 12;
});

const billingPeriod = computed<string>(() =>
  isYearlyPayment.value
    ? t('subscription.3d_secure.payment_info.per_year')
    : t('subscription.3d_secure.payment_info.per_month'),
);

const approvalInfo = computed<Record<string, string>>(() => {
  const { renewingPrice, finalAmount } = paymentInfo;
  return {
    renewingPrice,
    immediateAmount: finalAmount,
    period: get(billingPeriod),
  };
});
</script>

<template>
  <div class="w-full">
    <RuiCard>
      <!-- Header -->
      <div class="flex items-center gap-2 text-lg font-medium mb-6">
        <RuiIcon
          name="lu-credit-card"
          size="20"
        />
        <span>{{ t('subscription.3d_secure.payment_info.title') }}</span>
      </div>

      <!-- Recurring charge -->
      <div class="flex justify-between items-center mb-6">
        <span class="text-rui-text-secondary">{{ t('subscription.3d_secure.payment_info.recurring_charge') }}</span>
        <div class="text-right">
          <div class="font-semibold text-rui-text">
            {{ paymentInfo.renewingPrice }}€ <span class="text-sm text-rui-text-secondary font-normal">{{ billingPeriod }}</span>
          </div>
        </div>
      </div>

      <!-- Current charge (Grand Total) -->
      <div class="flex justify-between items-center py-4 border-y border-default">
        <span class="text-rui-text-secondary">{{ t('subscription.3d_secure.payment_info.charge_today') }}</span>
        <span class="font-bold text-xl underline">{{ paymentInfo.finalAmount }}€</span>
      </div>

      <!-- Approval notice -->
      <RuiAlert
        type="info"
        class="mt-4"
      >
        {{ t('subscription.3d_secure.payment_info.approval_notice', approvalInfo) }}
      </RuiAlert>
    </RuiCard>
  </div>
</template>
