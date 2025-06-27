import type { Ref } from 'vue';
import type { CryptoPayment, IdleStep, PendingTx, StepType } from '~/types';
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
import { get, set, useTimeoutFn } from '@vueuse/core';
import { BrowserProvider, Contract, parseUnits, type Signer, type TransactionResponse } from 'ethers';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

// Patch the showUnsupportedChainUI method to no-op
ChainController.showUnsupportedChainUI = function () {
  // No operation
};

const abi = [
  // Some details about the token
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  // Get the account balance
  'function balanceOf(address) view returns (uint)',
  // Send some of your tokens to someone else
  'function transfer(address to, uint amount)',
  // An event triggered whenever anyone transfers to someone else
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

const testNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, arbitrumSepolia, baseSepolia];
const productionNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, base, optimism, gnosis];

export const usePendingTx = createSharedComposable(() => useLocalStorage<PendingTx>('rotki.pending_tx', null, {
  serializer: {
    read: (v: any): any => (v ? JSON.parse(v) : null),
    write: (v: any): string => JSON.stringify(v),
  },
}));

interface ExecutePaymentParams {
  signer: Signer;
  payment: CryptoPayment;
  blockExplorerUrl: string;
}

export function useWeb3Payment(data: Ref<CryptoPayment>, state: Ref<StepType | IdleStep>, errorMessage: Ref<string>) {
  const { markTransactionStarted } = usePaymentCryptoStore();
  const connected = ref<boolean>(false);
  const isOpen = ref<boolean>(false);
  const connectedChainId = ref<bigint>();

  const logger = useLogger('web3-payment');
  const { t } = useI18n({ useScope: 'global' });
  const { public: { baseUrl, testing, walletConnect: { projectId } } } = useRuntimeConfig();
  const pendingTx = usePendingTx();
  const { start, stop } = useTimeoutFn(() => {
    logger.info('change to done');
    set(state, 'success');
  }, 5000, { immediate: false });

  const defaultNetwork = getNetwork(get(data).chainId);

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

  const getBrowserProvider = (): BrowserProvider => {
    assert(appKit);
    const walletProvider = appKit.getProvider('eip155');
    return new BrowserProvider(walletProvider as any);
  };

  appKit.subscribeAccount((account) => {
    set(state, 'idle');
    set(errorMessage, '');
    set(connected, account.isConnected);

    if (account.isConnected) {
      const browserProvider = getBrowserProvider();
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
    const paymentChainId = get(data).chainId;
    if (!isDefined(connectedChainId) || !paymentChainId)
      return false;
    return get(connectedChainId) === BigInt(paymentChainId);
  });

  async function executePayment({ blockExplorerUrl, payment, signer }: ExecutePaymentParams): Promise<void> {
    stop();
    const {
      cryptoAddress: to,
      cryptocurrency,
      decimals,
      finalPriceInCrypto,
      tokenAddress,
    } = payment;

    const currency = cryptocurrency.split(':')[1];
    const value = parseUnits(finalPriceInCrypto.toString(), decimals);

    let tx: TransactionResponse;

    logger.info(`preparing to send ${value} ${currency} to ${to}`);

    // Pay with native token
    if (!tokenAddress) {
      tx = await signer.sendTransaction({ to, value });
    }
    // Pay with non-native token
    else {
      const contract = new Contract(tokenAddress, abi, signer);
      tx = await (contract.transfer(to, value) as Promise<TransactionResponse>);
    }

    logger.info(`transaction is pending: ${tx.hash}`);

    set(pendingTx, {
      blockExplorerUrl,
      chainId: payment.chainId,
      hash: tx.hash,
      subscriptionId: payment.subscriptionId.toString(),
    });
    await markTransactionStarted();
    start();
  }

  const pay = async (): Promise<void> => {
    if (get(state) === 'pending')
      return;

    set(state, 'pending');

    try {
      if (!get(connected)) {
        set(errorMessage, t('subscription.crypto_payment.not_connected'));
        return;
      }

      const payment = get(data);
      assert(payment);

      const browserProvider = getBrowserProvider();
      const network = await browserProvider.getNetwork();

      const { chainId, chainName } = payment;
      assert(chainId);

      if (network.chainId !== BigInt(chainId)) {
        set(errorMessage, t('subscription.crypto_payment.invalid_chain', { actualName: network.name, chainName }));
        return;
      }

      const appKitNetwork = getNetwork(chainId);

      const url = appKitNetwork.blockExplorers?.default.url;
      await executePayment({
        blockExplorerUrl: url ? `${url}/tx/` : '',
        payment,
        signer: await browserProvider.getSigner(),
      });
    }
    catch (error: any) {
      logger.error(error);
      set(state, 'idle');

      if ('shortMessage' in error)
        set(errorMessage, error.shortMessage);
      else
        set(errorMessage, error.message);
    }
  };

  function getNetwork(chainId?: number): AppKitNetwork {
    const networks = testing ? testNetworks : productionNetworks;
    const network = networks.find(network => network.id === chainId);
    if (!network) {
      return testing ? testNetworks[0] : productionNetworks[0];
    }
    return network;
  }

  async function switchNetwork(): Promise<void> {
    const network = getNetwork(get(data).chainId);
    await appKit.switchNetwork(network);
  }

  onUnmounted(async () => {
    await appKit.disconnect();
  });

  return {
    connected: readonly(connected),
    isExpectedChain,
    isOpen: readonly(isOpen),
    open: async () => appKit.open(),
    pay,
    switchNetwork,
  };
}
