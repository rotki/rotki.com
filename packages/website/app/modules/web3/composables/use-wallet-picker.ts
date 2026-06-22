import type { Connector } from '@wagmi/core';
import type { Ref } from 'vue';
import { until } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { useWallet } from '~/modules/web3/composables/use-wallet';

/**
 * Shared open/close state for the single global {@link WalletPickerDialog}.
 * Any component can call `open()` to prompt a wallet connection; it eagerly
 * initializes the wallet so EIP-6963 discovery has populated
 * `availableConnectors` by the time the dialog renders.
 */
const isOpen = shallowRef<boolean>(false);

export interface UseWalletPickerReturn {
  isOpen: Readonly<Ref<boolean>>;
  availableConnectors: ReturnType<typeof useWallet>['availableConnectors'];
  connected: ReturnType<typeof useWallet>['connected'];
  connectorUid: ReturnType<typeof useWallet>['connectorUid'];
  connect: ReturnType<typeof useWallet>['connect'];
  disconnect: ReturnType<typeof useWallet>['disconnect'];
  reconnecting: ReturnType<typeof useWallet>['reconnecting'];
  open: () => Promise<void>;
  close: () => void;
}

export function useWalletPicker(): UseWalletPickerReturn {
  const { availableConnectors, connect, connected, connectorUid, disconnect, ensureInitialized, reconnecting } = useWallet();

  async function open(): Promise<void> {
    const wasConnected = get(connected);
    set(isOpen, true);
    // Build the config so injected wallets self-announce (EIP-6963) and the
    // connector list populates while the dialog is shown. This also kicks off
    // the background reconnect + liveness probe.
    await ensureInitialized();
    await until(reconnecting).toBe(false);
    // Opened from a disconnected state and a live session came back → the page
    // now reflects the connected wallet, so close instead of surfacing a
    // redundant "Connected" row. A "manage" open (already connected) stays open
    // so the Disconnect action remains reachable.
    if (!wasConnected && get(connected))
      set(isOpen, false);
  }

  function close(): void {
    set(isOpen, false);
  }

  return {
    availableConnectors,
    close,
    connect,
    connected,
    connectorUid,
    disconnect,
    isOpen: shallowReadonly(isOpen),
    open,
    reconnecting,
  };
}

/** Exposed for the dialog: drop duplicate connectors that share an id. */
export function dedupeConnectors(connectors: readonly Connector[]): Connector[] {
  const seen = new Set<string>();
  const result: Connector[] = [];
  for (const connector of connectors) {
    if (seen.has(connector.id))
      continue;
    seen.add(connector.id);
    result.push(connector);
  }
  return result;
}
