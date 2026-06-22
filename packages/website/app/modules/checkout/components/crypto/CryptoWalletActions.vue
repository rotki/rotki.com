<script setup lang="ts">
defineProps<{
  connected: boolean;
  isExpectedChain: boolean;
  processing: boolean;
  /** Hard-disable the pay button (e.g. insufficient balance for the price). */
  payDisabled?: boolean;
}>();

defineEmits<{
  'connect': [];
  'pay': [];
  'switch-network': [];
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
          :disabled="processing || payDisabled"
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
      </template>
    </div>
  </div>
</template>
