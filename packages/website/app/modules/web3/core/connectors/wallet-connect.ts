import { createConnector } from '@wagmi/core';
import { type Address, getAddress } from 'viem';

/**
 * Custom WalletConnect connector built on `@walletconnect/universal-provider`.
 *
 * We deliberately do NOT use wagmi's stock `walletConnect` connector: it depends
 * on `@walletconnect/ethereum-provider`, which statically imports `@reown/appkit-*`
 * (the modal). `universal-provider` is the headless layer with zero appkit
 * dependency. Instead of a bundled modal, we surface the pairing URI through the
 * standard wagmi `message`/`display_uri` event so the UI can render its own QR
 * with the existing `qrcode` dep.
 *
 * `UniversalProvider` itself is dynamically imported inside `getProvider`, so it
 * only loads when a user actually picks WalletConnect — never on the injected or
 * Coinbase path.
 */
export interface WalletConnectMetadata {
  name: string;
  description: string;
  url: string;
  icons: string[];
}

export interface WalletConnectParameters {
  projectId: string;
  metadata: WalletConnectMetadata;
}

/**
 * Minimal structural type for exactly the `UniversalProvider` surface we touch.
 * `UniversalProvider` instances satisfy this shape, so assignment needs no cast,
 * and it documents the contract precisely.
 */
interface WcProvider {
  session?: { namespaces?: Record<string, { accounts?: string[] }> };
  // `connect` opts are typed `any`: a real `UniversalProvider.connect` takes the
  // richer `ConnectParams`, and with property-signature style (enforced by lint)
  // this keeps a UniversalProvider assignable to WcProvider without a cast.
  connect: (opts: any) => Promise<unknown>;
  disconnect: () => Promise<void>;
  on: (event: string, listener: (...args: any[]) => void) => void;
  removeListener: (event: string, listener: (...args: any[]) => void) => void;
  setDefaultChain: (chain: string, rpcUrl?: string) => void;
}

const EIP155_METHODS = [
  'eth_sendTransaction',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v4',
  'eth_sign',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'eth_accounts',
  'eth_chainId',
];

const EIP155_EVENTS = ['chainChanged', 'accountsChanged'];

walletConnect.type = 'walletConnect';

export function walletConnect(parameters: WalletConnectParameters) {
  return createConnector<WcProvider>((config) => {
    let provider: WcProvider | undefined;
    let providerPromise: Promise<WcProvider> | undefined;
    let listenersBound = false;

    async function getProvider(): Promise<WcProvider> {
      if (provider)
        return provider;
      if (!providerPromise) {
        providerPromise = import('@walletconnect/universal-provider').then(async mod =>
          mod.UniversalProvider.init({ metadata: parameters.metadata, projectId: parameters.projectId }),
        );
      }
      const resolved = await providerPromise;
      if (!listenersBound) {
        // Bind the session listeners exactly once per provider instance so
        // repeated connect() calls (reconnects) can't stack duplicate handlers.
        resolved.on('accountsChanged', onAccountsChanged);
        resolved.on('chainChanged', onChainChanged);
        resolved.on('disconnect', onDisconnect);
        resolved.on('session_delete', onDisconnect);
        listenersBound = true;
      }
      provider = resolved;
      return resolved;
    }

    function accountsOf(active: WcProvider): readonly Address[] {
      const accounts = active.session?.namespaces?.eip155?.accounts ?? [];
      return accounts.flatMap((account) => {
        const address = account.split(':')[2];
        return address ? [getAddress(address)] : [];
      });
    }

    function chainIdOf(active: WcProvider): number {
      const [account] = active.session?.namespaces?.eip155?.accounts ?? [];
      const chain = account?.split(':')[1];
      return chain ? Number(chain) : config.chains[0].id;
    }

    function onAccountsChanged(accounts: string[]): void {
      if (accounts.length === 0)
        config.emitter.emit('disconnect');
      else
        config.emitter.emit('change', { accounts: accounts.map(account => getAddress(account)) });
    }

    function onChainChanged(chain: string): void {
      config.emitter.emit('change', { chainId: Number(chain) });
    }

    function onDisconnect(): void {
      config.emitter.emit('disconnect');
    }

    function onDisplayUri(uri: string): void {
      config.emitter.emit('message', { data: uri, type: 'display_uri' });
    }

    return {
      id: 'walletConnect',
      name: 'WalletConnect',
      type: walletConnect.type,

      getProvider,

      // Generic `WithCapabilities` signature mirrors wagmi's own connectors so
      // the return type satisfies `CreateConnectorFn` without a cast.
      async connect<WithCapabilities extends boolean = false>({ chainId, isReconnecting, withCapabilities }: { chainId?: number; isReconnecting?: boolean; withCapabilities?: WithCapabilities | boolean } = {}) {
        const active = await getProvider();

        // A silent reconnect (wagmi on page load) must only RESUME a session that
        // UniversalProvider.init() already restored from storage. If there is none,
        // fail fast instead of falling through to active.connect() — that would
        // start a fresh pairing with no QR shown, hang awaiting an approval that
        // never comes, and leave a half-open pairing that makes the user's next
        // manual connect hang too. (`eth_accounts`/`isAuthorized` are resolved
        // locally from the session, so a real restore needs no relay round-trip.)
        if (isReconnecting && !active.session)
          throw new Error('No WalletConnect session to resume');

        active.on('display_uri', onDisplayUri);

        try {
          if (!active.session) {
            const rpcMap: Record<string, string> = {};
            for (const chain of config.chains) {
              const url = chain.rpcUrls.default.http[0];
              if (url)
                rpcMap[`eip155:${chain.id}`] = url;
            }

            await active.connect({
              optionalNamespaces: {
                eip155: {
                  chains: config.chains.map(chain => `eip155:${chain.id}`),
                  events: EIP155_EVENTS,
                  methods: EIP155_METHODS,
                  rpcMap,
                },
              },
            });
          }

          const addresses = accountsOf(active);

          return {
            // `as never` mirrors wagmi's own connectors (mock/injected): TS cannot
            // narrow this value to `connect`'s conditional `withCapabilities` return
            // type, so the upstream API mandates the assertion here.
            // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
            accounts: (withCapabilities
              ? addresses.map(address => ({ address, capabilities: {} }))
              : addresses) as never,
            chainId: chainId ?? chainIdOf(active),
          };
        }
        finally {
          active.removeListener('display_uri', onDisplayUri);
        }
      },

      async disconnect() {
        // Session listeners are bound once in getProvider() and intentionally
        // left attached so a later reconnect on the same provider instance keeps
        // working without re-binding (and without stacking duplicates).
        const active = await getProvider();
        await active.disconnect();
      },

      async getAccounts() {
        return accountsOf(await getProvider());
      },

      async getChainId() {
        return chainIdOf(await getProvider());
      },

      async isAuthorized() {
        const active = await getProvider();
        return Boolean(active.session) && accountsOf(active).length > 0;
      },

      async switchChain({ chainId }) {
        const chain = config.chains.find(item => item.id === chainId);
        if (!chain)
          throw new Error(`Chain ${chainId} not configured`);
        const active = await getProvider();
        active.setDefaultChain(`eip155:${chainId}`, chain.rpcUrls.default.http[0]);
        config.emitter.emit('change', { chainId });
        return chain;
      },

      onAccountsChanged,
      onChainChanged,
      onDisconnect,
    };
  });
}
