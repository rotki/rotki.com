import {
  BrowserProvider,
  Contract,
  type Signer,
  type TransactionResponse,
  parseUnits,
} from 'ethers';
import { get, set, useTimeoutFn } from '@vueuse/core';
import { logger } from '~/utils/logger';
import { assert } from '~/utils/assert';
import { useMainStore } from '~/store';
import type {
  CryptoPayment,
  IdleStep,
  Provider,
  StepType,
} from '~/types';
import type { Ref } from 'vue';

const abi = [
  // Some details about the token
  'function name() view returns (string)',
  'function symbol() view returns (string)',

  // Get the account balance
  'function balanceOf(address) view returns (uint)',

  // Get the decimal number of a token
  'function decimals() public view returns (uint8)',

  // Send some of your tokens to someone else
  'function transfer(address to, uint amount)',

  // An event triggered whenever anyone transfers to someone else
  'event Transfer(address indexed from, address indexed to, uint amount)',
];

export const getChainId = (testing: boolean, chainId?: string | number) => BigInt(chainId ?? (testing ? 11155111 : 1));

export function useWeb3Payment(data: Ref<CryptoPayment | null>, getProvider: () => Provider, testing: boolean) {
  const { markTransactionStarted } = useMainStore();
  const state = ref<StepType | IdleStep>('idle');
  const error = ref('');
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
    set(state, 'pending');

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

  const payWithMetamask = async () => {
    try {
      const payment = get(data);
      assert(payment);
      const provider = getProvider();
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
        params: [],
      });

      if (!accounts || accounts.length === 0) {
        logger.info('missing permission');
        return;
      }
      const browserProvider = new BrowserProvider(provider);
      const network = await browserProvider.getNetwork();

      const {
        chainId,
        chainName,
      } = payment;

      const expectedChainId = getChainId(testing, chainId);

      if (network.chainId !== expectedChainId) {
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
    error,
    payWithMetamask,
    state,
  };
}
