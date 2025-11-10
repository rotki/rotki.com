<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { hexlify, toUtf8Bytes, type TransactionResponse } from 'ethers';
import { commonAttrs, getMetadata } from '~/utils/metadata';
import { useLogger } from '~/utils/use-logger';

useHead({
  title: 'Devconnect Argentina Demo',
  meta: getMetadata('rotki', 'Devconnect Argentina Demo', '/devconnect'),
  ...commonAttrs(),
});

definePageMeta({
  layout: false,
});

const ROTKI_ADDRESS = '0x9531C059098e3d194fF87FebB587aB07B30B1306';
const MAX_MESSAGE_LENGTH = 280;

const logger = useLogger('devconnect-demo');

const { connected, address, connectedChainId, open, getSigner, getNetwork } = useWeb3Connection({
  canSwitchNetwork: true,
});

const message = ref<string>('');
const isSending = ref<boolean>(false);
const errorMessage = ref<string>('');
const txHash = ref<string>('');
const blockExplorerUrl = ref<string>('');
const loadingMessage = ref<string>('');
const showSuccessDialog = ref<boolean>(false);

const remainingChars = computed<number>(() => MAX_MESSAGE_LENGTH - get(message).length);

const connectedChainName = computed<string | undefined>(() => {
  const chainId = get(connectedChainId);
  if (!chainId) {
    return undefined;
  }
  const network = getNetwork(Number(chainId));
  return network.name;
});

// Clear error and success messages when user starts typing
watch(message, (newValue, oldValue) => {
  // Only clear if user is actively typing (not when programmatically cleared)
  if (newValue && newValue !== oldValue) {
    set(errorMessage, '');
    set(txHash, '');
    set(blockExplorerUrl, '');
    set(showSuccessDialog, false);
  }
});

async function connectWallet(): Promise<void> {
  try {
    await open();
  }
  catch (error: any) {
    logger.error('Failed to connect wallet:', error);
    set(errorMessage, error.message || 'Failed to connect wallet');
  }
}

function convertMessageToHex(msg: string): string {
  const bytes = toUtf8Bytes(msg);
  return hexlify(bytes);
}

async function sendMessage(): Promise<void> {
  set(isSending, true);
  set(errorMessage, '');
  set(txHash, '');
  set(blockExplorerUrl, '');
  set(showSuccessDialog, false);
  set(loadingMessage, 'Confirm transaction in your wallet...');

  try {
    if (!get(connected)) {
      set(errorMessage, 'Wallet not connected');
      return;
    }

    const msg = get(message);
    if (!msg) {
      set(errorMessage, 'Please enter a message');
      return;
    }

    const signer = await getSigner();
    const chainId = get(connectedChainId);

    if (!chainId) {
      set(errorMessage, 'Chain ID not available');
      return;
    }

    // Get the network to access block explorer URL
    const network = getNetwork(Number(chainId));
    const explorerUrl = network.blockExplorers?.default.url;

    // Convert message to hex data
    const hexData = convertMessageToHex(msg);

    logger.info(`Sending message to ${ROTKI_ADDRESS} with data: ${hexData}`);

    set(loadingMessage, 'Sending transaction...');

    // Send transaction with 0 value and message as data
    const tx: TransactionResponse = await signer.sendTransaction({
      data: hexData,
      to: ROTKI_ADDRESS,
      value: 0,
    });

    logger.info(`Transaction sent: ${tx.hash}`);

    set(txHash, tx.hash);
    if (explorerUrl) {
      set(blockExplorerUrl, `${explorerUrl}/tx/${tx.hash}`);
    }

    // Clear the message after successful send
    set(message, '');

    // Show success dialog
    set(showSuccessDialog, true);
  }
  catch (error: any) {
    logger.error('Failed to send message:', error);

    if ('shortMessage' in error) {
      set(errorMessage, error.shortMessage);
    }
    else {
      set(errorMessage, error.message || 'Failed to send transaction');
    }
  }
  finally {
    set(isSending, false);
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
    <div class="w-full max-w-[600px]">
      <h1 class="mb-2 text-4xl font-bold text-center flex items-center justify-center gap-3">
        Send Message to <RuiLogo size="2" /> rotki.eth
      </h1>
      <div class="font-mono text-xs mb-8 text-center text-rui-text-secondary">
        ({{ ROTKI_ADDRESS }})
      </div>

      <RuiCard>
        <!-- Wallet Connection Section -->
        <div v-if="!connected || !connectedChainName || !address">
          <RuiButton
            color="primary"
            size="lg"
            class="w-full"
            @click="connectWallet()"
          >
            <template #prepend>
              <RuiIcon name="lu-wallet" />
            </template>
            Connect Wallet
          </RuiButton>
        </div>

        <!-- Connected Wallet Display -->
        <div
          v-else
          class="space-y-4"
        >
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-rui-text-secondary mb-1">
                Connected Address
              </div>
              <div class="flex items-center gap-2">
                <CryptoChainIcon :chain="connectedChainName" />
                <div class="font-mono text-xs truncate">
                  {{ address }}
                </div>
              </div>
            </div>
            <RuiButton
              variant="text"
              color="secondary"
              @click="open()"
            >
              <RuiIcon name="lu-wallet" />
            </RuiButton>
          </div>

          <RuiDivider />

          <!-- Message Input Form -->
          <div class="space-y-4">
            <div>
              <RuiTextArea
                v-model.trim="message"
                variant="outlined"
                color="primary"
                min-rows="3"
                label="Your Message"
                hint="Message will be sent as hex data (supports unicode)"
                :maxlength="MAX_MESSAGE_LENGTH"
                :disabled="isSending"
              />
              <div class="text-xs text-rui-text-secondary mt-1 text-right">
                {{ remainingChars }} characters remaining
              </div>
            </div>

            <RuiButton
              color="primary"
              size="lg"
              class="w-full"
              :loading="isSending"
              :disabled="!message || isSending"
              @click="sendMessage()"
            >
              <template #prepend>
                <RuiIcon name="lu-send" />
              </template>
              Send Message
            </RuiButton>
          </div>

          <!-- Error Message -->
          <RuiAlert
            v-if="errorMessage"
            type="error"
            class="mt-4"
          >
            {{ errorMessage }}
          </RuiAlert>
        </div>
      </RuiCard>

      <!-- Info Note -->
      <div class="mt-6 text-sm text-rui-text-secondary text-center">
        Send a message to the rotki.eth address. <br />
        Your message will be encoded as hex data in the transaction.
      </div>

      <img
        alt="Devconnect Argentina"
        src="/img/devconnect-argentina.png"
        class="w-20 mx-auto mt-4"
      />
    </div>

    <!-- Loading Dialog -->
    <RuiDialog
      v-model="isSending"
      max-width="400"
      :persistent="true"
    >
      <RuiCard>
        <template #header>
          Sending Transaction
        </template>
        <div class="flex flex-col items-center justify-center py-8 gap-4">
          <RuiProgress
            variant="indeterminate"
            circular
            color="primary"
          />
          <div class="text-center text-body-1">
            {{ loadingMessage }}
          </div>
        </div>
      </RuiCard>
    </RuiDialog>

    <!-- Success Dialog -->
    <RuiDialog
      v-model="showSuccessDialog"
      max-width="560"
    >
      <RuiCard content-class="!pt-0">
        <template #header>
          <div class="flex items-center gap-2">
            <RuiIcon
              name="lu-circle-check"
              color="success"
              size="24"
            />
            <span>Transaction Sent!</span>
          </div>
        </template>
        <div class="space-y-4">
          <div class="text-body-1 text-rui-text-secondary">
            Your message has been successfully sent to rotki.eth
          </div>
          <div class="p-3 bg-gray-50 rounded">
            <div class="text-sm text-rui-text-secondary mb-1">
              Transaction Hash
            </div>
            <div class="font-mono text-xs break-all">
              {{ txHash }}
            </div>
          </div>
        </div>
        <template #footer>
          <div class="w-full flex flex-col gap-4">
            <ButtonLink
              v-if="blockExplorerUrl"
              :to="blockExplorerUrl"
              external
              color="primary"
              class="w-full"
              size="sm"
            >
              <template #prepend>
                <RuiIcon name="lu-external-link" />
              </template>
              View on Block Explorer
            </ButtonLink>
            <RuiButton
              color="primary"
              class="w-full"
              @click="showSuccessDialog = false"
            >
              Close
            </RuiButton>
          </div>
        </template>
      </RuiCard>
    </RuiDialog>
  </div>
</template>
