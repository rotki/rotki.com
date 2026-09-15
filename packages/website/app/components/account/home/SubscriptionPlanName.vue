<script setup lang="ts">
import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { isSubRequestingUpgrade } from '@rotki/card-payment-common/utils/subscription';
import { get } from '@vueuse/shared';
import { useSubscriptionActions } from '~/composables/subscription/use-subscription-actions';

const { subscription, availablePlans } = defineProps<{
  subscription: UserSubscription;
  planName: string;
  availablePlans: AvailablePlans;
}>();

const { t } = useI18n({ useScope: 'global' });
const { canUpgradeSubscription } = useSubscriptionActions();

const isUpgradePending = computed<boolean>(() => isSubRequestingUpgrade(subscription));

/** An upgrade is only offered when none is already pending. */
const isUpgradeAvailable = computed<boolean>(() => !get(isUpgradePending) && canUpgradeSubscription(subscription, availablePlans));
</script>

<template>
  <div class="flex items-center gap-2">
    <span>{{ planName }}</span>
    <RuiChip
      v-if="isUpgradePending"
      size="sm"
      color="warning"
    >
      <div class="flex items-center gap-1">
        <RuiIcon
          name="lu-clock"
          size="14"
        />
        {{ t('account.subscriptions.upgrade_pending') }}
      </div>
    </RuiChip>
    <RuiChip
      v-else-if="isUpgradeAvailable"
      size="sm"
      color="primary"
    >
      <div class="flex items-center gap-1">
        <RuiIcon
          name="lu-sparkles"
          size="14"
        />
        {{ t('account.subscriptions.upgrade_available') }}
      </div>
    </RuiChip>
  </div>
</template>
