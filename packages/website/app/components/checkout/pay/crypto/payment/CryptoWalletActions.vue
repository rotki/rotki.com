<script setup lang="ts">
import { truncateAddress } from '~/utils/text';

defineProps<{
  connected: boolean;
  address?: string;
  isExpectedChain: boolean;
  processing: boolean;
}>();

defineEmits<{
  'connect': [];
  'pay': [];
  'switch-network': [];
  'open-wallet': [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="wallet-actions-section">
    <div class="flex flex-col sm:flex-row gap-1">
      <RuiButton
        v-if="!connected"
        color="primary"
        :loading="processing"
        :disabled="processing"
        size="lg"
        class="w-full"
        @click="$emit('connect')"
      >
        {{ t('home.plans.tiers.step_3.wallet.connect_wallet') }}
      </RuiButton>

      <template v-else>
        <RuiButton
          v-if="isExpectedChain"
          :loading="processing"
          :disabled="processing"
          color="primary"
          size="lg"
          class="w-full"
          @click="$emit('pay')"
        >
          {{ t('home.plans.tiers.step_3.wallet.pay_with_wallet') }}
        </RuiButton>

        <RuiButton
          v-else
          color="primary"
          size="lg"
          class="w-full"
          @click="$emit('switch-network')"
        >
          {{ t('home.plans.tiers.step_3.wallet.switch_network') }}
        </RuiButton>

        <RuiButton
          size="lg"
          color="secondary"
          class="!px-3"
          @click="$emit('open-wallet')"
        >
          <RuiIcon
            name="lu-wallet"
            size="20"
          />
        </RuiButton>
      </template>
    </div>

    <div
      v-if="connected && address"
      class="text-sm text-rui-text-secondary mt-2"
    >
      {{ t('sponsor.sponsor_page.connected_to', { address: truncateAddress(address) }) }}
    </div>
  </div>
</template>
