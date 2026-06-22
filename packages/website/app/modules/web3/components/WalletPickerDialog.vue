<script setup lang="ts">
import type { Connector } from '@wagmi/core';
import { get, set } from '@vueuse/shared';
import { dedupeConnectors, useWalletPicker } from '~/modules/web3/composables/use-wallet-picker';
import { type ConnectorDisplay, getConnectorDisplay, omitGenericInjected, sortConnectors } from '~/modules/web3/core/connector-display';
import { web3ErrorKey } from '~/modules/web3/core/errors';
import { useLogger } from '~/utils/use-logger';

const { t } = useI18n({ useScope: 'global' });

const { availableConnectors, close, connect, connected, connectorUid, disconnect, isOpen, reconnecting } = useWalletPicker();
const logger = useLogger('wallet-picker');

const connectingId = shallowRef<string>();
const errorMessage = shallowRef<string>();
const errorDetail = shallowRef<string>();
const qrUri = shallowRef<string>();
const qrCanvas = useTemplateRef<HTMLCanvasElement>('qrCanvas');

// Each connect attempt gets a token; cancelling (Back/close) bumps it so the
// still-pending connect() promise resolves into a no-op instead of reopening
// the QR or closing the dialog.
let attemptToken = 0;

const open = computed<boolean>({
  get: () => get(isOpen),
  set: (value) => {
    if (!value)
      close();
  },
});

interface DisplayConnector {
  connector: Connector;
  display: ConnectorDisplay;
}

const connectors = computed<DisplayConnector[]>(() =>
  sortConnectors(omitGenericInjected(dedupeConnectors(get(availableConnectors))))
    .map(connector => ({ connector, display: getConnectorDisplay(connector) })));

function isActive(connector: Connector): boolean {
  return get(connected) && get(connectorUid) === connector.uid;
}

async function handleDisconnect(): Promise<void> {
  set(errorMessage, undefined);
  set(errorDetail, undefined);
  const result = await disconnect();
  if (!result.ok) {
    const { error } = result;
    logger.error('wallet disconnect failed', error.cause ?? error);
    set(errorMessage, t(web3ErrorKey(error), { message: error.message }));
  }
}

// Cancel the in-flight attempt and return to the connector list.
function cancelConnection(): void {
  attemptToken += 1;
  set(qrUri, undefined);
  set(connectingId, undefined);
  set(errorMessage, undefined);
  set(errorDetail, undefined);
}

async function selectConnector(connector: Connector): Promise<void> {
  set(errorMessage, undefined);
  set(errorDetail, undefined);
  set(qrUri, undefined);
  set(connectingId, connector.uid);
  const token = (attemptToken += 1);

  const result = await connect(connector.uid, {
    onUri: (uri) => {
      // Ignore a late URI from an attempt the user already cancelled.
      if (token === attemptToken)
        set(qrUri, uri);
    },
  });

  // The user pressed Back / closed the dialog while this was pending — drop it.
  if (token !== attemptToken)
    return;

  set(connectingId, undefined);
  if (result.ok) {
    close();
  }
  else {
    set(qrUri, undefined);
    const { error } = result;
    // Always log the real cause — the friendly i18n string hides it.
    logger.error('wallet connect failed', error.cause ?? error);
    const message = t(web3ErrorKey(error), { message: error.message });
    set(errorMessage, message);
    // Surface the underlying error text when the friendly message omits it.
    set(errorDetail, error.message && error.message !== message ? error.message : undefined);
  }
}

// Render the WalletConnect pairing URI to our own QR canvas.
watch([qrCanvas, qrUri], async ([canvas, uri]) => {
  if (!canvas || !uri)
    return;
  try {
    const { toCanvas } = await import('qrcode');
    await toCanvas(canvas, uri, { width: 220 });
  }
  catch (error) {
    logger.error('failed to render WalletConnect QR', error);
  }
});

watch(isOpen, (value) => {
  if (!value)
    cancelConnection();
});
</script>

<template>
  <RuiDialog
    v-model="open"
    max-width="400px"
  >
    <RuiCard>
      <template #header>
        <div class="flex flex-col gap-1">
          <span>{{ t('wallet_picker.title') }}</span>
          <span class="text-sm font-normal text-rui-text-secondary">
            {{ t('wallet_picker.subtitle') }}
          </span>
        </div>
      </template>

      <!-- WalletConnect QR view -->
      <div
        v-if="qrUri"
        class="flex flex-col items-center gap-4 py-2"
      >
        <p class="text-sm text-rui-text-secondary text-center">
          {{ t('wallet_picker.scan_qr') }}
        </p>
        <div class="border rounded-md p-2 bg-white">
          <canvas ref="qrCanvas" />
        </div>
        <RuiButton
          variant="text"
          color="primary"
          @click="cancelConnection()"
        >
          {{ t('wallet_picker.back') }}
        </RuiButton>
      </div>

      <!-- Restoring a persisted session: wait until liveness is verified before
           showing the list, so a stale "connected" row never flashes. -->
      <div
        v-else-if="reconnecting"
        class="flex items-center justify-center gap-2 py-8 text-sm text-rui-text-secondary"
      >
        <RuiIcon
          name="lu-loader-circle"
          size="18"
          class="animate-spin"
        />
        {{ t('wallet_picker.restoring') }}
      </div>

      <!-- Connector list -->
      <div
        v-else
        class="flex flex-col gap-2"
      >
        <template
          v-for="{ connector, display } in connectors"
          :key="connector.uid"
        >
          <!-- Connected wallet: marked + disconnect action -->
          <div
            v-if="isActive(connector)"
            class="flex items-center gap-3 rounded-lg border border-rui-success/40 bg-rui-success/5 px-4 py-3"
          >
            <img
              v-if="display.icon"
              :src="display.icon"
              :alt="display.name"
              class="shrink-0 w-7 h-7 rounded-lg"
            />
            <span
              v-else
              class="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-rui-primary/10 text-rui-primary"
            >
              <RuiIcon
                name="lu-wallet"
                size="18"
              />
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-medium truncate">
                {{ display.name }}
              </p>
              <p class="flex items-center gap-1 text-xs text-rui-success">
                <RuiIcon
                  name="lu-circle-check"
                  size="14"
                />
                {{ t('wallet_picker.connected') }}
              </p>
            </div>
            <RuiButton
              variant="text"
              size="sm"
              color="error"
              @click="handleDisconnect()"
            >
              {{ t('wallet_picker.disconnect') }}
            </RuiButton>
          </div>

          <!-- Available wallet: connect on click -->
          <RuiButton
            v-else
            variant="outlined"
            size="lg"
            class="!justify-start !px-4 !py-3 [&>span]:w-full"
            :disabled="!!connectingId"
            @click="selectConnector(connector)"
          >
            <div class="flex items-center gap-3 w-full">
              <img
                v-if="display.icon"
                :src="display.icon"
                :alt="display.name"
                class="shrink-0 w-7 h-7 rounded-lg"
              />
              <span
                v-else
                class="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-rui-primary/10 text-rui-primary"
              >
                <RuiIcon
                  name="lu-wallet"
                  size="18"
                />
              </span>
              <span class="flex-1 text-left font-medium truncate">{{ display.name }}</span>
              <RuiIcon
                :name="connectingId === connector.uid ? 'lu-loader-circle' : 'lu-chevron-right'"
                size="18"
                class="shrink-0 text-rui-text-secondary"
                :class="{ 'animate-spin': connectingId === connector.uid }"
              />
            </div>
          </RuiButton>
        </template>

        <p
          v-if="connectors.length === 0"
          class="text-sm text-rui-text-secondary text-center py-4"
        >
          {{ t('wallet_picker.no_wallets') }}
        </p>

        <div
          v-if="errorMessage"
          class="flex flex-col gap-0.5 text-center"
        >
          <p class="text-sm text-rui-error">
            {{ errorMessage }}
          </p>
          <p
            v-if="errorDetail"
            class="text-xs text-rui-text-secondary break-words"
          >
            {{ errorDetail }}
          </p>
        </div>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
