import type { Signer, TransactionResponse } from 'ethers';
import type { ComputedRef, DeepReadonly, Ref } from 'vue';
import type { CryptoPayment } from '~/types';
import { get, set, useTimeoutFn } from '@vueuse/core';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useWeb3Connection } from '~/composables/web3/use-web3-connection';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
import { usePendingTx } from '~/modules/checkout/composables/use-pending-tx';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

interface EthersUtils {
  Contract: typeof import('ethers/contract').Contract;
  parseUnits: typeof import('ethers/utils').parseUnits;
}

async function getEthersUtils(): Promise<EthersUtils> {
  const [{ Contract }, { parseUnits }] = await Promise.all([
    import('ethers/contract'),
    import('ethers/utils'),
  ]);
  return { Contract, parseUnits };
}

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

interface ExecutePaymentParams {
  signer: Signer;
  payment: CryptoPayment;
  blockExplorerUrl: string;
  isUpgrade: boolean;
}

interface UseWeb3PaymentOptions {
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

interface UseWeb3PaymentReturn {
  address: Readonly<Ref<string | undefined>>;
  connected: Readonly<Ref<boolean>>;
  isExpectedChain: ComputedRef<boolean>;
  isOpen: Ref<boolean>;
  open: () => Promise<void>;
  pay: (isUpgrade: boolean) => Promise<void>;
  processing: DeepReadonly<Ref<boolean>>;
  switchNetwork: () => Promise<void>;
}

export function useWeb3Payment(data: Ref<CryptoPayment>, options: UseWeb3PaymentOptions = {}): UseWeb3PaymentReturn {
  const paymentApi = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const logger = useLogger('web3-payment');
  const { t } = useI18n({ useScope: 'global' });
  const pendingTx = usePendingTx();

  const processing = ref<boolean>(false);

  function setError(message: string): void {
    options.onError?.(message);
  }

  const { start, stop } = useTimeoutFn(() => {
    logger.info('Payment completed, triggering success');
    set(processing, false);
    options.onSuccess?.();
  }, 5000, { immediate: false });

  const connection = useWeb3Connection({
    chainId: get(data).chainId,
    onAccountChange: () => {
      set(processing, false);
    },
    onError: (error) => {
      setError(error);
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

    // Lazy load ethers utilities
    const { Contract, parseUnits } = await getEthersUtils();

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
      const transfer = contract.transfer;
      if (!transfer)
        throw new Error('Token contract does not support transfer');
      tx = await (transfer(to, value) as Promise<TransactionResponse>);
    }

    logger.info(`transaction is pending: ${tx.hash}`);

    set(pendingTx, {
      blockExplorerUrl,
      chainId: payment.chainId,
      hash: tx.hash,
      isUpgrade,
      subscriptionId: payment.subscriptionId.toString(),
    });
    paymentApi.markTransactionStarted(isUpgrade).catch(error => logger.error('Failed to mark transaction as started:', error));
    requestRefresh();
    start();
  }

  const pay = async (isUpgrade: boolean): Promise<void> => {
    if (get(processing))
      return;

    set(processing, true);

    try {
      if (!get(connected)) {
        setError(t('subscription.crypto_payment.not_connected'));
        set(processing, false);
        return;
      }

      const payment = get(data);
      assert(payment);

      const { chainId, chainName } = payment;
      assert(chainId);

      const provider = await getBrowserProvider();
      const network = await provider.getNetwork();

      if (network.chainId !== BigInt(chainId)) {
        setError(t('subscription.crypto_payment.invalid_chain', { actualName: network.name, chainName }));
        set(processing, false);
        return;
      }

      const appKitNetwork = getNetwork(chainId);
      const signer = await getSigner();

      const url = appKitNetwork?.blockExplorers?.default.url;
      await executePayment({
        blockExplorerUrl: url ? `${url}/tx/` : '',
        payment,
        signer,
        isUpgrade,
      });
    }
    catch (error: any) {
      logger.error(error);
      set(processing, false);

      if ('shortMessage' in error)
        setError(error.shortMessage);
      else
        setError(error.message);
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
    processing: readonly(processing),
    switchNetwork,
  };
}
