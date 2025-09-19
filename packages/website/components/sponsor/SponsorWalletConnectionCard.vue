<script setup lang="ts">
import { get } from '@vueuse/shared';
import { useSiweAuth } from '~/composables/siwe-auth';
import { useLogger } from '~/utils/use-logger';

const emit = defineEmits<{
  'view-submissions': [];
}>();
const { t } = useI18n({ useScope: 'global' });
const { connected: isConnected, address, open } = useWeb3Connection();
const { isSessionValid, isAuthenticating, authenticate } = useSiweAuth();

const logger = useLogger();

const isAuthenticated = computed<boolean>(() => {
  const addressVal = get(address);
  return get(isConnected) && !!addressVal && isSessionValid(addressVal);
});

async function connectWallet(): Promise<void> {
  try {
    await open();
  }
  catch (error) {
    logger.error('Failed to connect wallet:', error);
  }
}

async function handleSignMessage(): Promise<void> {
  const addressVal = get(address);
  if (addressVal) {
    await authenticate(addressVal);
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
        v-if="isAuthenticated"
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

      <RuiButton
        v-else
        color="primary"
        class="w-full"
        :loading="isAuthenticating"
        @click="handleSignMessage()"
      >
        <template #prepend>
          <img
            class="size-4 brightness-[75%] invert"
            alt="ethereum"
            src="/img/chains/ethereum.svg"
          />
        </template>
        {{ t('sponsor.submit_name.sign_to_continue') }}
      </RuiButton>
    </div>
  </RuiCard>
</template>
