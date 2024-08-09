import {
  BrowserProvider,
  Contract,
  type Signer,
  type TransactionResponse,
  parseUnits,
} from 'ethers';
import { get, set, useTimeoutFn } from '@vueuse/core';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/vue';
import { useLogger } from '~/utils/use-logger';
import { assert } from '~/utils/assert';
import { useMainStore } from '~/store';
import type { Web3Modal } from '@web3modal/ethers';
import type {
  CryptoPayment,
  IdleStep,
  StepType,
} from '~/types';
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

export function useWeb3Payment(data: Ref<CryptoPayment | null>, testing: boolean) {
  const web3Modal = ref<Web3Modal>();
  const connected = ref(false);
  const { markTransactionStarted } = useMainStore();
  const state = ref<StepType | IdleStep>('idle');
  const error = ref('');

  const logger = useLogger('web3-payment');

  const { start, stop } = useTimeoutFn(
    () => {
      logger.info('change to done');
      set(state, 'success');
    },
    5000,
    { immediate: false },
  );

  async function executePayment(signer: Signer): Promise<void> {
    stop();
    const payment = get(data);
    assert(payment);

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
      tx = await signer.sendTransaction({
        to,
        value,
      });
    }
    // Pay with non-native token
    else {
      const contract = new Contract(tokenAddress, abi, signer);

      tx = await (contract.transfer(
        to,
        value,
      ) as Promise<TransactionResponse>);
    }

    logger.info(`transaction is pending: ${tx.hash}`);
    await markTransactionStarted();
    start();
  }

  function handleChange({ isConnected }: { isConnected: boolean }) {
    clearErrors();
    set(connected, isConnected);
  }

  const {
    public: {
      baseUrl,
      walletConnect: {
        projectId,
      },
    },
  } = useRuntimeConfig();

  watchImmediate(data, (payment) => {
    if (!payment)
      return;

    const {
      chainId,
      chainName,
    } = payment;

    // 2. Set chains
    const expectedChainId = getChainId(testing, chainId);
    const network = {
      chainId: expectedChainId,
      currency: '',
      explorerUrl: '',
      name: toTitleCase(chainName),
      rpcUrl: '',
    };

    // 3. Create your application's metadata object
    const metadata = {
      description: 'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.',
      icons: ['https://raw.githubusercontent.com/rotki/data/main/assets/icons/app_logo.png'],
      name: 'Rotki',
      url: baseUrl,
    };

    // 4. Create Ethers config
    const ethersConfig = defaultConfig({
      defaultChainId: 1,
      enableEIP6963: true,
      enableInjected: true,
      metadata,
    });

    // 5. Create a AppKit instance
    const modal = createWeb3Modal({
      chains: [network],
      enableAnalytics: true,
      ethersConfig,
      projectId,
    });

    modal.subscribeProvider(handleChange);

    set(web3Modal, modal);
  });

  const pay = async () => {
    if (get(state) === 'pending')
      return;

    set(state, 'pending');

    try {
      const modal = get(web3Modal);
      assert(modal);

      if (!modal.getIsConnected()) {
        set(error, 'User is disconnected');
        return;
      }

      const payment = get(data);
      assert(payment);
      const walletProvider = modal.getWalletProvider();
      assert(walletProvider);

      const browserProvider = new BrowserProvider(walletProvider);
      const network = await browserProvider.getNetwork();

      const {
        chainId,
        chainName,
      } = payment;

      const expectedChainId = getChainId(testing, chainId);

      if (network.chainId !== BigInt(expectedChainId)) {
        set(
          error,
          `We are expecting payments on ${chainName} but found ${network.name}. Change the network and try again.`,
        );
        return;
      }
      const signer = await browserProvider.getSigner();

      await executePayment(signer);
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

  return {
    clearErrors,
    connected,
    error,
    pay,
    state,
    web3Modal,
  };
}
