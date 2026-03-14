<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { ContextColorsType } from '@rotki/ui-library';
import type { PendingTx } from '~/types';
import { isCancelledButActive } from '@rotki/card-payment-common';
import { useSubscriptionCryptoPayment } from '~/composables/subscription/use-subscription-crypto-payment';
import { useSubscriptionDisplay } from '~/composables/subscription/use-subscription-display';
import { formatDate } from '~/utils/date';

const { subscription } = defineProps<{
  subscription: UserSubscription;
  pendingTx: PendingTx | null;
}>();

const { t } = useI18n({ useScope: 'global' });

const { getChipStatusColor } = useSubscriptionDisplay();

const { isCryptoPaymentPending } = useSubscriptionCryptoPayment({
  renewableSubscriptions: computed<UserSubscription[]>(() =>
    subscription.actions.includes('renew') ? [subscription] : [],
  ),
});

const chipColor = computed<ContextColorsType | undefined>(() => getChipStatusColor(subscription.status));
const isCancelled = computed<boolean>(() => isCancelledButActive(subscription));
const isPendingCrypto = computed<boolean>(() => isCryptoPaymentPending(subscription));
</script>

<template>
  <RuiChip
    size="sm"
    :color="chipColor"
  >
    <RuiTooltip v-if="isCancelled">
      <template #activator>
        <div class="flex py-0.5 items-center gap-1">
          <RuiIcon
            size="16"
            class="text-white"
            name="lu-info"
          />
          {{ t('account.subscriptions.cancelled_but_still_active.status', { date: formatDate(subscription.nextActionDate) }) }}
        </div>
      </template>
      {{ t('account.subscriptions.cancelled_but_still_active.description', { date: formatDate(subscription.nextActionDate) }) }}
    </RuiTooltip>
    <template v-else>
      {{ subscription.status }}
      <RuiProgress
        v-if="isPendingCrypto"
        thickness="2"
        variant="indeterminate"
      />
    </template>
  </RuiChip>
</template>
