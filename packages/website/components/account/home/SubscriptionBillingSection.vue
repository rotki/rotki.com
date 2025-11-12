<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { isCancelledButActive } from '@rotki/card-payment-common';

interface Props {
  subscription: UserSubscription;
  formattedDate: string;
  relativeTime: string;
}

const props = defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });

const isCancelled = computed<boolean>(() => isCancelledButActive(props.subscription));
</script>

<template>
  <div
    class="mb-6 p-4 rounded-lg"
    :class="isCancelled ? 'bg-rui-warning/5 border border-rui-warning/20' : 'bg-rui-primary/5 border border-rui-primary/20'"
  >
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 text-sm text-rui-text-secondary mb-1">
          <RuiIcon
            :name="isCancelled ? 'lu-calendar-x' : 'lu-credit-card'"
            size="16"
          />
          <span>{{ isCancelled ? t('account.subscriptions.access_expires') : t('account.subscriptions.next_billing') }}</span>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="text-h5 font-bold"
            :class="isCancelled ? 'text-rui-warning line-through' : 'text-rui-primary'"
          >
            {{ subscription.nextBillingAmount ? subscription.nextBillingAmount.toFixed(2) : '0.00' }} €
          </div>
          <span
            v-if="isCancelled"
            class="text-xs text-rui-text-secondary"
          >
            ({{ t('account.subscriptions.cancelled_but_still_active.no_charge') }})
          </span>
        </div>
        <div class="text-sm text-rui-text-secondary mt-1">
          {{ formattedDate }}
          <span
            class="font-medium"
            :class="isCancelled ? 'text-rui-warning' : 'text-rui-primary'"
          >
            ({{ relativeTime }})
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
