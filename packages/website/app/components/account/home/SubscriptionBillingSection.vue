<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { isCancelledButActive } from '@rotki/card-payment-common/utils/subscription';

const { subscription, formattedDate, relativeTime } = defineProps<{
  subscription: UserSubscription;
  formattedDate: string;
  relativeTime: string;
}>();

const { t } = useI18n({ useScope: 'global' });

const isCancelled = computed<boolean>(() => isCancelledButActive(subscription));
</script>

<template>
  <div>
    <p class="text-caption font-medium uppercase tracking-wide text-rui-text-secondary">
      {{ isCancelled ? t('account.subscriptions.access_expires') : t('account.subscriptions.next_billing') }}
    </p>
    <p class="mt-1 flex flex-wrap items-baseline gap-x-2">
      <span
        class="text-h5 tabular-nums"
        :class="isCancelled ? 'text-rui-text-secondary line-through' : 'text-rui-text'"
      >
        {{ subscription.nextBillingAmount ? subscription.nextBillingAmount.toFixed(2) : '0.00' }} €
      </span>
      <span
        v-if="isCancelled"
        class="text-caption text-rui-text-secondary"
      >
        {{ t('account.subscriptions.cancelled_but_still_active.no_charge') }}
      </span>
    </p>
    <p class="mt-0.5 text-body-2 text-rui-text-secondary">
      {{ formattedDate }}<template v-if="relativeTime">
        ({{ relativeTime }})
      </template>
    </p>
  </div>
</template>
