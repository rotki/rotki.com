<script setup lang="ts">
import { useLogger } from '~/utils/use-logger';

const emit = defineEmits<{
  'view-submissions': [];
}>();
const { t } = useI18n();
const { connected: isConnected, address, open } = useWeb3Connection();

const logger = useLogger();

async function connectWallet(): Promise<void> {
  try {
    await open();
  }
  catch (error) {
    logger.error('Failed to connect wallet:', error);
  }
}
</script>

<template>
  <RuiCard class="mb-4">
    <div v-if="!isConnected">
      <RuiButton
        color="primary"
        size="lg"
        class="w-full"
        @click="connectWallet()"
      >
        <template #prepend>
          <RuiIcon name="lu-wallet" />
        </template>
        {{ t('sponsor.submit_name.connect_wallet') }}
      </RuiButton>
    </div>
    <div
      v-else
      class="flex flex-col gap-3"
    >
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <div class="text-sm text-rui-text-secondary mb-1">
            {{ t('sponsor.submit_name.connected_address') }}
          </div>
          <div class="font-mono text-sm">
            {{ address }}
          </div>
        </div>
        <RuiButton
          color="secondary"
          @click="open()"
        >
          <RuiIcon name="lu-wallet" />
        </RuiButton>
      </div>

      <RuiDivider />

      <RuiButton
        variant="text"
        color="primary"
        class="w-full"
        @click="emit('view-submissions')"
      >
        <template #prepend>
          <RuiIcon
            name="lu-list"
            size="16"
          />
        </template>
        {{ t('sponsor.submit_name.view_submissions') }}
      </RuiButton>
    </div>
  </RuiCard>
</template>
