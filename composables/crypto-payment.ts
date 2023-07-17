import {
  BrowserProvider,
  Contract,
  type JsonRpcSigner,
  type Signer,
  type TransactionResponse,
  parseEther,
} from 'ethers';
import { get, set, useTimeoutFn } from '@vueuse/core';
import { type Ref } from 'vue';
import { logger } from '~/utils/logger';
import {
  type CryptoPayment,
  type IdleStep,
  type Provider,
  type StepType,
} from '~/types';
import { assert } from '~/utils/assert';
import { useMainStore } from '~/store';

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

export const getChainId = (testing: boolean) => BigInt(testing ? 11155111 : 1);

export const useWeb3Payment = (
  data: Ref<CryptoPayment | null>,
  getProvider: () => Provider,
  testing: boolean,
) => {
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

  async function payWithEth(signer: JsonRpcSigner) {
    stop();
    const payment = get(data);
    assert(payment);
    const value = parseEther(payment.finalPriceInCrypto);
    const to = payment.cryptoAddress;
    logger.info(
      `preparing to send ${payment.finalPriceInCrypto}(${value}) ETH to ${to}`,
    );
    set(state, 'pending');
    const tx = await signer.sendTransaction({
      to,
      value,
    });
    logger.info(`transaction is pending: ${tx.hash}`);
    await markTransactionStarted();
    start();
  }

  async function payWithDai(signer: Signer): Promise<void> {
    stop();
    const payment = get(data);
    assert(payment);
    const {
      cryptoAddress,
      finalPriceInCrypto,
      tokenAddress: contractAddress,
    } = payment;
    assert(contractAddress);
    const contract = new Contract(contractAddress, abi, signer);
    const price = parseEther(finalPriceInCrypto);
    logger.info(`preparing to send ${price} DAI to ${cryptoAddress}`);
    set(state, 'pending');
    const tx = await (contract.transfer(
      cryptoAddress,
      price,
    ) as Promise<TransactionResponse>);
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

      const expected = getChainId(testing);
      const name = testing ? 'Sepolia' : 'Mainnet';
      if (network.chainId !== expected) {
        set(
          error,
          `We are expecting payments on ${name} but found ${network.name}`,
        );
        return;
      }

      const signer = await browserProvider.getSigner();

      if (payment.cryptocurrency === 'ETH') {
        await payWithEth(signer);
      } else if (payment.cryptocurrency === 'DAI') {
        await payWithDai(signer);
      }
    } catch (e: any) {
      logger.error(e);

      if ('reason' in e) {
        set(error, e.reason);
      } else {
        set(error, e.message);
      }
    }
  };

  return {
    payWithMetamask,
    state,
    error,
  };
};
