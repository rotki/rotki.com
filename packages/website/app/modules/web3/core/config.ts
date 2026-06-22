import type { Config, CreateConnectorFn } from '@wagmi/core';
import type { Transport } from 'viem';
import { coinbaseWallet, injected } from '@wagmi/connectors';
import { getChainMeta, loadViemChains } from './chains';

const APP_DESCRIPTION = 'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.';
const APP_LOGO_URL = 'https://raw.githubusercontent.com/rotki/data/main/assets/icons/app_logo.png';

/**
 * Per-request RPC timeout. Bounds each read so a stalled/black-holed endpoint
 * fails fast and the `fallback` transport advances to the next URL — restoring
 * the guarantee the old circuit-breaker rpc-checker provided.
 */
const RPC_TIMEOUT_MS = 20_000;

export interface CreateWeb3ConfigOptions {
  /** Use testnets (Sepolia family) instead of production chains. */
  testing: boolean;
  /** WalletConnect Cloud project id. */
  projectId: string;
  /** dApp name shown in wallet prompts. */
  appName: string;
  /** dApp url (wallet metadata). */
  appUrl: string;
  /** Optional logo override (wallet metadata). */
  appLogoUrl?: string;
  /**
   * Override the connector list. Production omits this and gets injected
   * (EIP-6963) + Coinbase + custom WalletConnect; tests pass `[mock({...})]`.
   */
  connectors?: CreateConnectorFn[];
  /** Override transports (tests pass a mock transport). */
  transports?: Record<number, Transport>;
}

/**
 * Build the singleton `@wagmi/core` {@link Config}. Everything heavy
 * (@wagmi/core, @wagmi/connectors, viem chains, our WC connector) only loads
 * behind the `use-wallet` lazy boundary, since this whole module is reached via
 * a dynamic `import('./config')`.
 *
 * Dependency-injected by design: `connectors`/`transports` overrides let unit
 * tests construct a fully working config around wagmi's `mock()` connector with
 * no network and no real wallet.
 */
export async function createWeb3Config(options: CreateWeb3ConfigOptions): Promise<Config> {
  // injected/coinbaseWallet are static named imports (top of file), not part of
  // this dynamic batch: that lets Rollup drop the unused `tempoWallet`, whose
  // `import('accounts')` (an uninstalled optional peer) otherwise breaks the chunk.
  const [{ createConfig, fallback, http }, { walletConnect }, chains] = await Promise.all([
    import('@wagmi/core'),
    import('./connectors/wallet-connect'),
    loadViemChains(options.testing),
  ]);

  const metadata = {
    description: APP_DESCRIPTION,
    icons: [options.appLogoUrl ?? APP_LOGO_URL],
    name: options.appName,
    url: options.appUrl,
  };

  const connectors = options.connectors ?? [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appLogoUrl: options.appLogoUrl ?? APP_LOGO_URL, appName: options.appName }),
    walletConnect({ metadata, projectId: options.projectId }),
  ];

  const transports = options.transports
    ?? Object.fromEntries(chains.map((chain) => {
      const urls = getChainMeta(chain.id)?.rpcUrls;
      return [
        chain.id,
        urls && urls.length > 0
          ? fallback(urls.map(url => http(url, { timeout: RPC_TIMEOUT_MS })))
          : http(undefined, { timeout: RPC_TIMEOUT_MS }),
      ];
    }));

  return createConfig({
    chains,
    connectors,
    // Native EIP-6963 discovery: installed wallets self-announce and become
    // connectors automatically; the explicit injected() above covers legacy
    // window.ethereum wallets that don't.
    multiInjectedProviderDiscovery: true,
    transports,
  });
}
