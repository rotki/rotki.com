<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { formatDate } from '~/utils/date';

defineProps<{
  subscription: UserSubscription;
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <ul class="list-disc ml-5 font-medium">
    <li>
      <i18n-t
        keypath="account.subscriptions.resume.details.plan_name"
        class="font-medium"
        scope="global"
      >
        <template #plan>
          <span class="font-normal">{{ subscription.planName }}</span>
        </template>
      </i18n-t>
    </li>
    <li>
      <i18n-t
        keypath="account.subscriptions.resume.details.billing_cycle"
        class="font-medium"
        scope="global"
      >
        <template #duration>
          <span class="font-normal">
            {{ t('account.subscriptions.resume.details.duration_in_months', { duration: subscription.durationInMonths }) }}
          </span>
        </template>
      </i18n-t>
    </li>

    <li>
      <i18n-t
        keypath="account.subscriptions.resume.details.billing_amount"
        class="font-medium"
        scope="global"
      >
        <template #amount>
          <span class="font-normal">
            {{ t('account.subscriptions.resume.details.amount_in_eur', { amount: subscription.nextBillingAmount }) }}
          </span>
        </template>
      </i18n-t>
    </li>

    <li>
      <i18n-t
        keypath="account.subscriptions.resume.details.next_billing_date"
        class="font-medium"
        scope="global"
      >
        <template #date>
          <span class="font-normal">{{ formatDate(subscription.nextActionDate) }}</span>
        </template>
      </i18n-t>
    </li>
  </ul>
</template>
