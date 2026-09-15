<script setup lang="ts">
import type { Subscription } from '@rotki/card-payment-common/schemas/subscription';
import { formatDate } from '~/utils/date';
import { formatCurrency } from '~/utils/text';

const { subscriptionData, isReauthorization } = defineProps<{
  subscriptionData: Pick<Subscription, 'nextBillingAmount' | 'nextActionDate' | 'durationInMonths'>;
  isReauthorization?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const billingPeriod = computed<string>(() => subscriptionData.durationInMonths === 12
  ? t('common.yearly')
  : t('common.monthly'));
</script>

<template>
  <div class="flex flex-col gap-2">
    <div class="font-medium">
      {{ t('payment_methods.three_d_secure.billing_info_title') }}
    </div>
    <div>
      {{ t(isReauthorization ? 'payment_methods.three_d_secure.billing_info_reauth' : 'payment_methods.three_d_secure.billing_info_replace') }}
      <i18n-t
        keypath="payment_methods.three_d_secure.billing_info_schedule"
        tag="span"
        scope="global"
      >
        <template #date>
          <span class="font-medium">{{ formatDate(subscriptionData.nextActionDate) }}</span>
        </template>
        <template #amount>
          <span class="font-medium">{{ formatCurrency(subscriptionData.nextBillingAmount) }}</span>
        </template>
        <template #period>
          <span class="font-medium">{{ billingPeriod }}</span>
        </template>
      </i18n-t>
    </div>
  </div>
</template>
