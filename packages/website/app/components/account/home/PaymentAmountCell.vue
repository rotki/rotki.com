<script setup lang="ts">
import type { UserPayment } from '~/types/account';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { discountAmount } from '~/utils/money';

defineProps<{
  payment: UserPayment;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex items-center justify-end gap-2">
    <RuiTooltip
      v-if="payment.discount && payment.priceBeforeDiscount"
      :open-delay="200"
    >
      <template #activator>
        <RuiIcon
          name="lu-badge-percent"
          class="text-rui-primary"
          size="18"
        />
      </template>
      <i18n-t
        keypath="account.payments.price_before_discount"
        scope="global"
        tag="div"
      >
        <template #amount>
          <b>{{ payment.priceBeforeDiscount }}</b>
        </template>
      </i18n-t>
      <i18n-t
        keypath="home.plans.tiers.step_3.discount.you_save"
        scope="global"
        tag="div"
      >
        <template #amount>
          <div class="inline-flex gap-1">
            <b>{{ discountAmount(payment.priceBeforeDiscount, payment.eurAmount) }}</b>
            <template v-if="payment.discount.type === DiscountType.PERCENTAGE">
              {{
                t('home.plans.tiers.step_3.discount.percent_off', {
                  percentage: payment.discount.amount,
                })
              }}
            </template>
          </div>
        </template>
      </i18n-t>
    </RuiTooltip>
    <RuiTooltip
      v-if="!payment.legacy && payment.referralCreditAppliedEur > 0"
      :open-delay="200"
    >
      <template #activator>
        <RuiIcon
          name="lu-coins"
          class="text-rui-success"
          size="18"
        />
      </template>
      {{ t('account.payments.credit_applied', { amount: payment.referralCreditAppliedEur }) }}
    </RuiTooltip>
    {{ payment.eurAmount }} €
  </div>
</template>
