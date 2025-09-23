import type { Ref } from 'vue';
import type { CryptoPayment, IdleStep, PendingTx, StepType } from '~/types';
import { get, set, useTimeoutFn } from '@vueuse/core';
import { Contract, parseUnits, type Signer, type TransactionResponse } from 'ethers';
import { usePaymentCryptoStore } from '~/store/payments/crypto';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

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
  isUpgrade: boolean;
}

export function useWeb3Payment(data: Ref<CryptoPayment>, state: Ref<StepType | IdleStep>, errorMessage: Ref<string>) {
  const { markTransactionStarted } = usePaymentCryptoStore();
  const logger = useLogger('web3-payment');
  const { t } = useI18n({ useScope: 'global' });
  const pendingTx = usePendingTx();
  const { start, stop } = useTimeoutFn(() => {
    logger.info('change to done');
    set(state, 'success');
  }, 5000, { immediate: false });

  const connection = useWeb3Connection({
    chainId: get(data).chainId,
    onAccountChange: () => {
      set(state, 'idle');
      set(errorMessage, '');
    },
    onError: (error) => {
      set(errorMessage, error);
    },
  });

  const {
    address,
    connected,
    getBrowserProvider,
    getNetwork,
    getSigner,
    isExpectedChain,
    isOpen,
    ...connectionMethods
  } = connection;

  async function executePayment({ blockExplorerUrl, isUpgrade, payment, signer }: ExecutePaymentParams): Promise<void> {
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
      isUpgrade,
      subscriptionId: payment.subscriptionId.toString(),
    });
    await markTransactionStarted(isUpgrade);
    start();
  }

  const pay = async (isUpgrade: boolean): Promise<void> => {
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

      const { chainId, chainName } = payment;
      assert(chainId);

      const provider = getBrowserProvider();
      const network = await provider.getNetwork();

      if (network.chainId !== BigInt(chainId)) {
        set(errorMessage, t('subscription.crypto_payment.invalid_chain', { actualName: network.name, chainName }));
        return;
      }

      const appKitNetwork = getNetwork(chainId);
      const signer = await getSigner();

      const url = appKitNetwork.blockExplorers?.default.url;
      await executePayment({
        blockExplorerUrl: url ? `${url}/tx/` : '',
        isUpgrade,
        payment,
        signer,
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

  async function switchNetwork(): Promise<void> {
    await connection.switchNetwork(get(data).chainId);
  }

  return {
    address,
    connected,
    isExpectedChain,
    isOpen,
    open: connectionMethods.open,
    pay,
    switchNetwork,
  };
}
