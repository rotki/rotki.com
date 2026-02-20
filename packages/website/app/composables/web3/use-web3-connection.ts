import type { AppKit } from '@reown/appkit';
import type { AppKitNetwork } from '@reown/appkit/networks';
import type { Signer } from 'ethers';
import { get, set } from '@vueuse/core';
import { useSharedWeb3State } from '~/composables/web3/use-shared-web3-state';
import { useLogger } from '~/utils/use-logger';

// Lazy-loaded module cache
let appKitInstance: AppKit | undefined;
let networkConfig: {
  testNetworks: [AppKitNetwork, ...AppKitNetwork[]];
  productionNetworks: [AppKitNetwork, ...AppKitNetwork[]];
} | undefined;

interface Web3ConnectionConfig {
  chainId?: MaybeRef<number>;
  onAccountChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
  canSwitchNetwork?: boolean;
}

/**
 * Lazy-load network configurations
 */
async function loadNetworkConfig(): Promise<typeof networkConfig> {
  if (networkConfig)
    return networkConfig;

  const networks = await import('@reown/appkit/networks');
  networkConfig = {
    testNetworks: [networks.sepolia, networks.arbitrumSepolia, networks.baseSepolia],
    productionNetworks: [
      networks.mainnet,
      networks.arbitrum,
      networks.base,
      networks.optimism,
      networks.gnosis,
      networks.polygon,
      networks.bsc,
      networks.scroll,
    ],
  };
  return networkConfig;
}

/**
 * Initialize AppKit lazily - only when first needed
 */
async function initializeAppKit(options: {
  baseUrl: string;
  testing: boolean;
  projectId: string;
  canSwitchNetwork: boolean;
  defaultChainId?: number;
}): Promise<AppKit> {
  if (appKitInstance)
    return appKitInstance;

  // Dynamically import heavy dependencies
  const [
    { EthersAdapter },
    { ChainController },
    { createAppKit },
    config,
  ] = await Promise.all([
    import('@reown/appkit-adapter-ethers'),
    import('@reown/appkit-controllers'),
    import('@reown/appkit/vue'),
    loadNetworkConfig(),
  ]);

  // Patch the showUnsupportedChainUI method to no-op
  ChainController.showUnsupportedChainUI = function () {
    // No operation
  };

  const availableNetworks = options.testing ? config!.testNetworks : config!.productionNetworks;
  const defaultNetwork = availableNetworks.find(n => n.id === options.defaultChainId) ?? availableNetworks[0];

  appKitInstance = createAppKit({
    adapters: [new EthersAdapter()],
    allowUnsupportedChain: true,
    features: {
      analytics: true,
      email: false,
      onramp: false,
      socials: false,
      swaps: false,
    },
    metadata: {
      description: 'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.',
      icons: ['https://raw.githubusercontent.com/rotki/data/main/assets/icons/app_logo.png'],
      name: 'Rotki',
      url: options.baseUrl,
    },
    networks: options.canSwitchNetwork ? availableNetworks : [defaultNetwork],
    projectId: options.projectId,
    themeMode: 'light',
    themeVariables: {
      '--w3m-font-family': 'Roboto, sans-serif',
    },
  });

  return appKitInstance;
}

export function useWeb3Connection(config: Web3ConnectionConfig = {}) {
  const { chainId, onAccountChange, onError, canSwitchNetwork = false } = config;

  const { address, connected, connectedChainId, initialized, initializing, isOpen } = useSharedWeb3State();
  const errorMessage = shallowRef<string>('');

  const logger = useLogger('web3-connection');
  const { public: { baseUrl, testing, walletConnect: { projectId } } } = useRuntimeConfig();

  // Notify per-instance callbacks when account state changes
  if (onAccountChange) {
    watch(() => get(connected), (isConnected) => {
      onAccountChange(isConnected);
    });
  }

  /**
   * Ensure AppKit is initialized before use
   */
  async function ensureInitialized(): Promise<AppKit> {
    if (get(initialized) && appKitInstance)
      return appKitInstance;

    if (get(initializing)) {
      // Wait for existing initialization
      while (get(initializing)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return appKitInstance!;
    }

    set(initializing, true);

    try {
      const appKit = await initializeAppKit({
        baseUrl,
        canSwitchNetwork,
        defaultChainId: get(chainId),
        projectId,
        testing,
      });

      // Initialize state from current appKit connection
      const currentAccount = appKit.getAccount();
      if (currentAccount?.isConnected) {
        const { getAddress } = await import('ethers/address');
        set(connected, true);
        set(address, currentAccount.address ? getAddress(currentAccount.address) : undefined);
        const caipNetworkId = appKit.getCaipNetworkId();
        if (isDefined(caipNetworkId)) {
          set(connectedChainId, BigInt(caipNetworkId));
        }
      }

      // Subscribe to account changes
      appKit.subscribeAccount((account) => {
        set(connected, account.isConnected);

        if (account.isConnected && account.address) {
          handleAccountConnected(account.address).catch(error => logger.error(error));
        }
        else {
          set(address, undefined);
          set(connectedChainId, undefined);
        }
      });

      // Subscribe to modal state
      appKit.subscribeState((state) => {
        set(isOpen, state.open);
      });

      set(initialized, true);
      return appKit;
    }
    finally {
      set(initializing, false);
    }
  }

  async function handleAccountConnected(accountAddress: string): Promise<void> {
    const { getAddress } = await import('ethers/address');
    set(address, getAddress(accountAddress));

    const browserProvider = await getBrowserProvider();
    const network = await browserProvider.getNetwork();
    set(connectedChainId, network.chainId);
  }

  async function getBrowserProvider(): Promise<InstanceType<typeof import('ethers/providers').BrowserProvider>> {
    const appKit = await ensureInitialized();
    const { BrowserProvider } = await import('ethers/providers');
    const walletProvider = appKit.getProvider('eip155');
    return new BrowserProvider(walletProvider as any);
  }

  function getNetwork(networkChainId?: number): AppKitNetwork | undefined {
    if (!networkConfig)
      return undefined;
    const networks = testing ? networkConfig.testNetworks : networkConfig.productionNetworks;
    return networks.find(network => network.id === networkChainId) ?? networks[0];
  }

  const isExpectedChain = computed<boolean>(() => {
    const expectedChainId = get(chainId);
    const currentChainId = get(connectedChainId);

    if (!isDefined(connectedChainId) || !expectedChainId) {
      return false;
    }

    return currentChainId === BigInt(expectedChainId);
  });

  async function switchNetwork(targetChainId?: number): Promise<void> {
    const appKit = await ensureInitialized();
    await loadNetworkConfig();
    const network = getNetwork(targetChainId || get(chainId));
    if (network) {
      await appKit.switchNetwork(network);
    }
  }

  async function getSigner(): Promise<Signer> {
    if (!get(connected)) {
      throw new Error('Wallet not connected');
    }

    const browserProvider = await getBrowserProvider();
    return browserProvider.getSigner();
  }

  async function validateNetwork(expectedChainId?: number): Promise<void> {
    const provider = await getBrowserProvider();
    const network = await provider.getNetwork();
    const targetChainId = expectedChainId || get(chainId);

    if (targetChainId && network.chainId !== BigInt(targetChainId)) {
      const expectedNetwork = getNetwork(targetChainId);
      throw new Error(`Invalid network. Expected: ${expectedNetwork?.name ?? 'Unknown'}, Connected: ${network.name}`);
    }
  }

  async function signMessage(message: string): Promise<string> {
    if (!get(connected)) {
      throw new Error('Wallet not connected');
    }

    const signer = await getSigner();
    return signer.signMessage(message);
  }

  function setError(error: string): void {
    set(errorMessage, error);
    onError?.(error);
  }

  async function open(): Promise<void> {
    const appKit = await ensureInitialized();
    await appKit.open();
  }

  return {
    // State
    address: readonly(address),
    connected: readonly(connected),
    connectedChainId: readonly(connectedChainId),
    ensureInitialized,
    errorMessage: readonly(errorMessage),
    getBrowserProvider,

    getNetwork,
    getSigner,
    initialized: readonly(initialized),
    initializing: readonly(initializing),
    isExpectedChain,
    isOpen: readonly(isOpen),
    // Methods
    open,
    setError,
    signMessage,
    switchNetwork,

    validateNetwork,
  };
}
