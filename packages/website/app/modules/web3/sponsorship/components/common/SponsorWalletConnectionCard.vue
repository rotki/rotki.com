<script setup lang="ts">
import { get } from '@vueuse/shared';
import WalletAccountSummary from '~/modules/web3/components/WalletAccountSummary.vue';
import { useWallet } from '~/modules/web3/composables/use-wallet';
import { useWalletPicker } from '~/modules/web3/composables/use-wallet-picker';
import { useSiweAuth } from '~/modules/web3/sponsorship/use-siwe-auth';
import { useLogger } from '~/utils/use-logger';

const emit = defineEmits<{
  'view-submissions': [];
}>();
const { t } = useI18n({ useScope: 'global' });
const { address, connected: isConnected } = useWallet();
const { open } = useWalletPicker();
const { isSessionValid, isAuthenticating, authenticate, authError } = useSiweAuth();

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
  if (!addressVal)
    return;

  try {
    await authenticate(addressVal);
  }
  catch (error) {
    logger.error('Failed to sign message:', error);
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
      <WalletAccountSummary
        v-if="address"
        :address="address"
        :open="open"
      />

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

      <div
        v-else
        class="flex flex-col gap-2"
      >
        <RuiAlert
          v-if="authError"
          type="error"
        >
          {{ authError }}
        </RuiAlert>

        <RuiButton
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
              width="16"
              height="16"
            />
          </template>
          {{ t('sponsor.submit_name.sign_to_continue') }}
        </RuiButton>
      </div>
    </div>
  </RuiCard>
</template>
