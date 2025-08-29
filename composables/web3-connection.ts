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
import { BrowserProvider, getAddress, type Signer } from 'ethers';
import { useLogger } from '~/utils/use-logger';

// Patch the showUnsupportedChainUI method to no-op
ChainController.showUnsupportedChainUI = function () {
  // No operation
};

const testNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, arbitrumSepolia, baseSepolia];
const productionNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, base, optimism, gnosis];

export interface Web3ConnectionConfig {
  chainId?: MaybeRef<number>;
  onAccountChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
}

export function useWeb3Connection(config: Web3ConnectionConfig = {}) {
  const { chainId, onAccountChange, onError } = config;

  const connected = ref<boolean>(false);
  const isOpen = ref<boolean>(false);
  const connectedChainId = ref<bigint>();
  const errorMessage = ref<string>('');
  const address = ref<string>();

  const logger = useLogger('web3-connection');
  const { public: { baseUrl, testing, walletConnect: { projectId } } } = useRuntimeConfig();

  const defaultNetwork = getNetwork(get(chainId));

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

  // Initialize state from current appKit connection
  const currentAccount = appKit.getAccount();
  if (currentAccount && currentAccount.isConnected) {
    set(connected, true);
    set(address, currentAccount.address ? getAddress(currentAccount.address) : undefined);
    const caipNetworkId = appKit.getCaipNetworkId();
    if (isDefined(caipNetworkId)) {
      set(connectedChainId, BigInt(caipNetworkId));
    }
  }

  const getBrowserProvider = (): BrowserProvider => {
    assert(appKit);
    const walletProvider = appKit.getProvider('eip155');
    return new BrowserProvider(walletProvider as any);
  };

  appKit.subscribeAccount((account) => {
    set(errorMessage, '');
    set(connected, account.isConnected);
    set(address, account.isConnected && account.address ? getAddress(account.address) : undefined);
    onAccountChange?.(account.isConnected);

    if (account.isConnected) {
      const browserProvider = getBrowserProvider();
      browserProvider.getNetwork()
        .then(network => set(connectedChainId, network.chainId))
        .catch(logger.error);
    }
    else {
      set(connectedChainId, undefined);
      set(address, undefined);
    }
  });

  appKit.subscribeState((state) => {
    set(isOpen, state.open);
  });

  const isExpectedChain = computed<boolean>(() => {
    const expectedChainId = get(chainId);
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
    const network = getNetwork(targetChainId || get(chainId));
    await appKit.switchNetwork(network);
  }

  async function getSigner(): Promise<Signer> {
    if (!get(connected)) {
      throw new Error('Wallet not connected');
    }

    const browserProvider = getBrowserProvider();
    return browserProvider.getSigner();
  }

  async function validateNetwork(expectedChainId?: number): Promise<void> {
    const provider = getBrowserProvider();
    const network = await provider.getNetwork();
    const targetChainId = expectedChainId || get(chainId);

    if (targetChainId && network.chainId !== BigInt(targetChainId)) {
      const expectedNetwork = getNetwork(targetChainId);
      throw new Error(`Invalid network. Expected: ${expectedNetwork.name}, Connected: ${network.name}`);
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

  return {
    // State
    address: readonly(address),
    // Internal appKit instance (for advanced usage)
    appKit,
    connected: readonly(connected),
    connectedChainId: readonly(connectedChainId),
    errorMessage: readonly(errorMessage),
    getBrowserProvider,

    getNetwork,
    getSigner,
    isExpectedChain,
    isOpen: readonly(isOpen),
    // Methods
    open: async () => appKit.open(),
    setError,
    signMessage,
    switchNetwork,

    validateNetwork,
  };
}
