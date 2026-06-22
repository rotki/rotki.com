import type { Config, Connector, GetAccountReturnType } from '@wagmi/core';
import type { Address } from 'viem';
import type { ComputedRef, Ref } from 'vue';
import { get, set } from '@vueuse/shared';
import { pipe } from 'plainfp/pipe';
import { err, type Result } from 'plainfp/result';
import * as RA from 'plainfp/result-async';
import { useAppConfig } from '~/composables/use-app-config';
import { noWallet, type Web3Error } from '~/modules/web3/core/errors';
import { useLogger } from '~/utils/use-logger';

/**
 * Single Vue boundary over the web3 core. Owns the lazily-built wagmi `Config`,
 * keeps shared reactive account/chain state in sync via wagmi watchers, and
 * exposes the connection-level ops as `Result<T, Web3Error>`.
 *
 * Scope is deliberately connection-only (connect / disconnect / switch / sign /
 * state). Transaction & contract ops live in the domain modules (checkout,
 * sponsorship), which call `core/actions` directly with the `Config` obtained
 * from {@link UseWalletReturn.ensureInitialized}.
 *
 * Laziness: NOTHING from `@wagmi/core` / `viem` / the connectors is imported
 * statically here — `ensureInitialized()` pulls `core/config` + `core/actions` +
 * `@wagmi/core` watchers via `await import()` on first interaction, so the whole
 * web3 stack code-splits out of the initial bundle. State and types
 * (`import type`) are the only things this module carries eagerly.
 */
type ConnectionStatus = GetAccountReturnType['status'];

type ActionsModule = typeof import('~/modules/web3/core/actions');

// Module-level singletons: one config + one shared reactive state for the whole app.
const address = shallowRef<Address>();
const connectedChainId = shallowRef<number>();
const status = shallowRef<ConnectionStatus>('disconnected');
const availableConnectors = shallowRef<readonly Connector[]>([]);
const connectorUid = shallowRef<string>();
// True while the persisted session is being restored + liveness-verified on load.
// Gates `connected` so the picker never surfaces wagmi's optimistic, not-yet-
// verified "connected" state (e.g. a wallet that is actually locked).
const reconnecting = shallowRef<boolean>(false);

let configPromise: Promise<Config> | undefined;

/** Minimal EIP-1193 surface — just enough to probe accounts cast-free. */
interface RequestProvider {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
}

function isRequestProvider(value: unknown): value is RequestProvider {
  return typeof value === 'object' && value !== null && typeof Reflect.get(value, 'request') === 'function';
}

export interface UseWalletReturn {
  address: Readonly<Ref<Address | undefined>>;
  connectedChainId: Readonly<Ref<number | undefined>>;
  status: Readonly<Ref<ConnectionStatus>>;
  connected: ComputedRef<boolean>;
  /** True while a persisted session is being restored + liveness-verified on load. */
  reconnecting: Readonly<Ref<boolean>>;
  /** Lazily restore a persisted session on mount (no-op when none exists). */
  restoreIfPersisted: () => Promise<void>;
  connectorUid: Readonly<Ref<string | undefined>>;
  availableConnectors: Readonly<Ref<readonly Connector[]>>;
  isExpectedChain: (expected: number | undefined) => boolean;
  ensureInitialized: () => Promise<Config>;
  connect: (connectorId?: string, options?: { chainId?: number; onUri?: (uri: string) => void }) => Promise<Result<{ accounts: readonly Address[]; chainId: number }, Web3Error>>;
  disconnect: () => Promise<Result<void, Web3Error>>;
  switchChain: (chainId: number) => Promise<Result<void, Web3Error>>;
  signMessage: (message: string) => Promise<Result<string, Web3Error>>;
}

export function useWallet(): UseWalletReturn {
  const { public: { baseUrl, walletConnect: { projectId } } } = useRuntimeConfig();
  const { isTesting } = useAppConfig();
  const logger = useLogger('use-wallet');

  type WagmiModule = typeof import('@wagmi/core');

  /**
   * Confirm a restored connector is actually usable. `eth_accounts` is the
   * non-prompting EIP-1193 read: a locked or deauthorized wallet returns no
   * accounts, which is exactly the stale "connected" state we want to drop. Any
   * failure along the way (no provider / rejected read) folds to "not live".
   */
  async function hasLiveAccounts(connector: Connector): Promise<boolean> {
    return pipe(
      RA.fromPromise(connector.getProvider(), error => error),
      RA.flatMap(async (provider): RA.ResultAsync<boolean, unknown> => isRequestProvider(provider)
        ? pipe(
            RA.fromPromise(provider.request({ method: 'eth_accounts' }), error => error),
            RA.map(accounts => Array.isArray(accounts) && accounts.length > 0),
          )
        : RA.ok(false)),
      RA.tapError((error) => { logger.debug('account liveness probe failed', error); }),
      RA.getOr(false),
    );
  }

  /**
   * Restore a previously authorized session without prompting, then verify it is
   * live. wagmi's `reconnect()` is optimistic — it trusts the persisted store and
   * only self-corrects later via wallet events, so a wallet locked at page load
   * is restored as "connected" with a stale address. The liveness probe closes
   * that gap by dropping any restored-but-dead session.
   */
  async function restoreSession(config: Config, wagmi: WagmiModule): Promise<void> {
    const restored = await pipe(
      RA.fromPromise(wagmi.reconnect(config), error => error),
      RA.tapError((error) => { logger.debug('reconnect skipped', error); }),
    );
    if (!restored.ok)
      return;

    const account = wagmi.getAccount(config);
    if (account.status !== 'connected' || !account.connector)
      return;

    if (await hasLiveAccounts(account.connector))
      return;

    logger.debug('restored session is not live; disconnecting');
    await pipe(
      RA.fromPromise(wagmi.disconnect(config, { connector: account.connector }), error => error),
      RA.tapError((error) => { logger.debug('stale-session cleanup failed', error); }),
    );
  }

  async function ensureInitialized(): Promise<Config> {
    if (configPromise)
      return configPromise;

    configPromise = (async (): Promise<Config> => {
      set(reconnecting, true);

      try {
        const [{ createWeb3Config }, wagmi] = await Promise.all([
          import('~/modules/web3/core/config'),
          import('@wagmi/core'),
        ]);

        const config = await createWeb3Config({
          appName: 'rotki',
          appUrl: baseUrl,
          projectId,
          testing: get(isTesting),
        });

        const syncAccount = (account: GetAccountReturnType): void => {
          set(address, account.address);
          set(connectedChainId, account.chainId);
          set(status, account.status);
          set(connectorUid, account.connector?.uid);
        };

        syncAccount(wagmi.getAccount(config));
        set(availableConnectors, wagmi.getConnectors(config));

        wagmi.watchAccount(config, { onChange: syncAccount });
        wagmi.watchConnectors(config, { onChange: connectors => set(availableConnectors, connectors) });

        // Restore + liveness-verify in the background; clear the gate once settled
        // so `connected` only ever reflects a verified session.
        restoreSession(config, wagmi)
          .finally(() => set(reconnecting, false))
          .catch(error => logger.debug('session restore failed', error));

        return config;
      }
      catch (error) {
        // Build failed before the background restore could clear the gate — clear
        // it here so the picker never freezes on "Restoring…", and drop the cached
        // rejected promise so a later interaction can rebuild instead of replaying
        // the failure forever.
        set(reconnecting, false);
        configPromise = undefined;
        throw error;
      }
    })();

    return configPromise;
  }

  /**
   * Restore a persisted session when the page mounts, without pulling the web3
   * chunk for visitors who have no wallet to reconnect. wagmi clears
   * `recentConnectorId` on disconnect, so its presence is the cheap, import-free
   * signal that a previously-authorized session exists. The heavy work then runs
   * behind the same dynamic-import boundary as {@link ensureInitialized} (reconnect
   * + liveness verify), so nothing is pre-bundled.
   */
  async function restoreIfPersisted(): Promise<void> {
    if (typeof localStorage === 'undefined' || !localStorage.getItem('wagmi.recentConnectorId'))
      return;
    try {
      await ensureInitialized();
    }
    catch (error) {
      logger.debug('session restore on mount failed', error);
    }
  }

  async function withActions<T>(fn: (config: Config, api: ActionsModule) => Promise<T>): Promise<T> {
    const [config, api] = await Promise.all([
      ensureInitialized(),
      import('~/modules/web3/core/actions'),
    ]);
    return fn(config, api);
  }

  function resolveConnector(config: Config, connectorId?: string): Connector | undefined {
    const connectors = get(availableConnectors);
    if (!connectorId)
      return connectors[0];
    return connectors.find(connector => connector.id === connectorId || connector.uid === connectorId);
  }

  async function connect(connectorId?: string, options: { chainId?: number; onUri?: (uri: string) => void } = {}): Promise<Result<{ accounts: readonly Address[]; chainId: number }, Web3Error>> {
    const config = await ensureInitialized();
    const connector = resolveConnector(config, connectorId);
    if (!connector)
      return err(noWallet());

    // Surface the WalletConnect pairing URI (emitted as a `message`/display_uri
    // event) so the picker can render its own QR.
    let detach: (() => void) | undefined;
    if (options.onUri) {
      const handler = (payload: { type: string; data?: unknown }): void => {
        if (payload.type === 'display_uri' && typeof payload.data === 'string')
          options.onUri!(payload.data);
      };
      connector.emitter.on('message', handler);
      detach = () => connector.emitter.off('message', handler);
    }

    try {
      const api = await import('~/modules/web3/core/actions');
      return await api.connectWallet(config, connector, options.chainId);
    }
    finally {
      detach?.();
    }
  }

  // While reconnecting, wagmi may report the persisted (unverified) "connected"
  // status — withhold it until `restoreSession` confirms the wallet is live.
  const connected = computed<boolean>(() => get(status) === 'connected' && !get(reconnecting));

  function isExpectedChain(expected: number | undefined): boolean {
    return expected !== undefined && get(connectedChainId) === expected;
  }

  return {
    address: shallowReadonly(address),
    availableConnectors: shallowReadonly(availableConnectors),
    connect,
    connected,
    connectedChainId: shallowReadonly(connectedChainId),
    connectorUid: shallowReadonly(connectorUid),
    disconnect: async () => withActions(async (config, api) => api.disconnectWallet(config)),
    ensureInitialized,
    isExpectedChain,
    reconnecting: shallowReadonly(reconnecting),
    restoreIfPersisted,
    signMessage: async message => withActions(async (config, api) => api.signMessage(config, message)),
    status: shallowReadonly(status),
    switchChain: async chainId => withActions(async (config, api) => api.switchChain(config, chainId)),
  };
}
