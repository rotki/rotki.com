<script setup lang="ts">
import type { PaymentInfo } from '@rotki/card-payment-common/schemas/three-d-secure';

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
</script>

<template>
  <div class="w-full max-w-md">
    <RuiCard
      variant="outlined"
    >
      <div class="space-y-3">
        <!-- Header -->
        <div class="flex items-center gap-2 mb-2">
          <RuiIcon
            name="lu-credit-card"
            size="18"
          />
          <span class="font-semibold text-sm">{{ t('subscription.3d_secure.payment_info.title') }}</span>
        </div>

        <!-- Current charge -->
        <div class="flex justify-between items-center pb-2 border-b border-rui-grey-300 dark:border-rui-grey-800">
          <span class="text-sm text-rui-text-secondary">{{ t('subscription.3d_secure.payment_info.charge_today') }}</span>
          <span class="text-lg font-bold text-rui-text">{{ paymentInfo.finalAmount }}€</span>
        </div>

        <!-- Recurring charge -->
        <div class="flex justify-between items-center pb-2">
          <span class="text-sm text-rui-text-secondary">{{ t('subscription.3d_secure.payment_info.recurring_charge') }}</span>
          <div class="text-right">
            <div class="font-semibold text-rui-text">
              {{ paymentInfo.amount }}€ <span class="text-xs text-rui-text-secondary font-normal">{{ billingPeriod }}</span>
            </div>
          </div>
        </div>

        <!-- Approval notice -->
        <div class="text-xs text-rui-text-secondary bg-rui-primary/10 dark:bg-rui-primary/20 p-2 rounded">
          {{ t('subscription.3d_secure.payment_info.approval_notice', { amount: paymentInfo.amount, period: billingPeriod }) }}
        </div>
      </div>
    </RuiCard>
  </div>
</template>
