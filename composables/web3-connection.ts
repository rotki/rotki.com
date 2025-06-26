import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { ChainController } from '@reown/appkit-controllers';
import {
  type AppKitNetwork,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  gnosis,
  mainnet,
  optimism,
  sepolia,
} from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/vue';
import { get, set } from '@vueuse/core';
import { BrowserProvider, type Signer } from 'ethers';
import { useLogger } from '~/utils/use-logger';

// Patch the showUnsupportedChainUI method to no-op
ChainController.showUnsupportedChainUI = function () {
  // No operation
};

const testNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, arbitrumSepolia, baseSepolia];
const productionNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, base, optimism, gnosis];

export interface Web3ConnectionConfig {
  chainId?: number;
  onAccountChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
}

export function useWeb3Connection(config: Web3ConnectionConfig = {}) {
  const { chainId, onAccountChange, onError } = config;

  const connected = ref<boolean>(false);
  const isOpen = ref<boolean>(false);
  const connectedChainId = ref<bigint>();
  const errorMessage = ref<string>('');

  const logger = useLogger('web3-connection');
  const { public: { baseUrl, testing, walletConnect: { projectId } } } = useRuntimeConfig();

  const defaultNetwork = getNetwork(chainId);

  const appKit = createAppKit({
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
      url: baseUrl,
    },
    networks: [defaultNetwork],
    projectId,
    themeMode: 'light',
  });

  const getProvider = (): BrowserProvider => {
    assert(appKit);
    const walletProvider = appKit.getProvider('eip155');
    return new BrowserProvider(walletProvider as any);
  };

  appKit.subscribeAccount((account) => {
    set(errorMessage, '');
    set(connected, account.isConnected);
    onAccountChange?.(account.isConnected);

    if (account.isConnected) {
      const browserProvider = getProvider();
      browserProvider.getNetwork()
        .then(network => set(connectedChainId, network.chainId))
        .catch(logger.error);
    }
    else {
      set(connectedChainId, undefined);
    }
  });

  appKit.subscribeState((state) => {
    set(isOpen, state.open);
  });

  const isExpectedChain = computed<boolean>(() => {
    const expectedChainId = chainId;
    const currentChainId = get(connectedChainId);

    if (!isDefined(connectedChainId) || !expectedChainId) {
      return false;
    }

    return currentChainId === BigInt(expectedChainId);
  });

  function getNetwork(chainId?: number): AppKitNetwork {
    const networks = testing ? testNetworks : productionNetworks;
    const network = networks.find(network => network.id === chainId);
    if (!network) {
      return testing ? testNetworks[0] : productionNetworks[0];
    }
    return network;
  }

  async function switchNetwork(targetChainId?: number): Promise<void> {
    const network = getNetwork(targetChainId || chainId);
    await appKit.switchNetwork(network);
  }

  async function getSigner(): Promise<Signer> {
    if (!get(connected)) {
      throw new Error('Wallet not connected');
    }

    const browserProvider = getProvider();
    return browserProvider.getSigner();
  }

  async function validateNetwork(expectedChainId?: number): Promise<void> {
    const provider = getProvider();
    const network = await provider.getNetwork();
    const targetChainId = expectedChainId || chainId;

    if (targetChainId && network.chainId !== BigInt(targetChainId)) {
      const expectedNetwork = getNetwork(targetChainId);
      throw new Error(`Invalid network. Expected: ${expectedNetwork.name}, Connected: ${network.name}`);
    }
  }

  function setError(error: string): void {
    set(errorMessage, error);
    onError?.(error);
  }

  onUnmounted(async () => {
    await appKit.disconnect();
  });

  return {
    // Internal appKit instance (for advanced usage)
    appKit,
    // State
    connected: readonly(connected),
    connectedChainId: readonly(connectedChainId),
    errorMessage: readonly(errorMessage),
    getNetwork,

    getProvider,
    getSigner,
    isExpectedChain,
    isOpen: readonly(isOpen),
    // Methods
    open: async () => appKit.open(),
    setError,
    switchNetwork,

    validateNetwork,
  };
}
