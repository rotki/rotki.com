import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import {
  type AppKitNetwork,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  sepolia,
} from '@reown/appkit/networks';
import { createAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/vue';
import { get, set, useTimeoutFn } from '@vueuse/core';
import { BrowserProvider, Contract, type Signer, type TransactionResponse, parseUnits } from 'ethers';
import { useMainStore } from '~/store';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';
import type { CryptoPayment, IdleStep, StepType } from '~/types';
import type { Ref } from 'vue';

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

export const getChainId = (testing: boolean, chainId?: string | number) => Number(chainId ?? (testing ? 11155111 : 1));

const testNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [sepolia, arbitrumSepolia, baseSepolia];
const productionNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, base];

export function useWeb3Payment(data: Ref<CryptoPayment | undefined>) {
  const { markTransactionStarted } = useMainStore();
  const state = ref<StepType | IdleStep>('idle');
  const error = ref('');

  const logger = useLogger('web3-payment');
  const { t } = useI18n();
  const { public: { baseUrl, testing, walletConnect: { projectId } } } = useRuntimeConfig();
  const { start, stop } = useTimeoutFn(() => {
    logger.info('change to done');
    set(state, 'success');
  }, 5000, { immediate: false });

  const account = useAppKitAccount();
  const defaultNetwork = getNetwork(get(data)?.chainId);

  const appKit = createAppKit({
    adapters: [new EthersAdapter()],
    allowUnsupportedChain: false,
    defaultNetwork,
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
    networks: testing ? testNetworks : productionNetworks,
    projectId,
    themeMode: 'light',
  });

  appKit.subscribeAccount(() => {
    clearErrors();
  });

  async function executePayment(signer: Signer, payment: CryptoPayment): Promise<void> {
    stop();
    const {
      cryptoAddress: to,
      cryptocurrency,
      decimals,
      finalPriceInCrypto,
      tokenAddress,
    } = payment;

    const currency = cryptocurrency.split(':')[1];
    const value = parseUnits(finalPriceInCrypto, decimals);

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
    await markTransactionStarted();
    start();
  }

  const pay = async (): Promise<void> => {
    if (get(state) === 'pending')
      return;

    set(state, 'pending');

    try {
      if (!get(account, 'isConnected')) {
        set(error, t('subscription.crypto_payment.not_connected'));
        return;
      }

      const payment = get(data);
      assert(payment);

      const { walletProvider } = useAppKitProvider('eip155');
      const browserProvider = new BrowserProvider(walletProvider as any);
      const network = await browserProvider.getNetwork();

      const { chainId, chainName } = payment;
      const expectedChainId = getChainId(testing, chainId);

      if (network.chainId !== BigInt(expectedChainId)) {
        set(error, t('subscription.crypto_payment.invalid_chain', { actualName: network.name, chainName }));
        return;
      }

      await executePayment(await browserProvider.getSigner(), payment);
    }
    catch (error_: any) {
      logger.error(error_);
      set(state, 'idle');

      if ('reason' in error_ && error_.reason)
        set(error, error_.reason);

      else
        set(error, error_.message);
    }
  };

  function clearErrors() {
    set(error, null);
    set(state, 'idle');
  }

  function getNetwork(chainId?: number): AppKitNetwork {
    const networks = testing ? testNetworks : productionNetworks;
    const network = networks.find(network => network.id === chainId);
    if (!network) {
      return testing ? testNetworks[0] : productionNetworks[0];
    }
    return network;
  }

  onUnmounted(async () => {
    await appKit.disconnect();
  });

  return {
    clearErrors,
    error,
    pay,
    state,
  };
}
