import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import type { CryptoPayment } from '~/types';
import { CheckoutPaymentMethods, CheckoutSteps, classifyCryptoTxError, monthsToPlanDuration, PaymentServerEvents, SigilEvents } from '@rotki/sigil';
import { useTimeoutFn } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { err, getOr, ok, type Result } from 'plainfp/result';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
import { usePaymentLogger } from '~/modules/checkout/composables/use-payment-logger';
import { usePendingTx } from '~/modules/checkout/composables/use-pending-tx';
import { getWeb3Client } from '~/modules/web3/client';
import { useTokenBalance } from '~/modules/web3/composables/use-token-balance';
import { useWallet } from '~/modules/web3/composables/use-wallet';
import { useWalletPicker } from '~/modules/web3/composables/use-wallet-picker';
import { blockExplorerTxUrl } from '~/modules/web3/core/chains';
import { isNativeToken } from '~/modules/web3/core/erc20';
import { notConnected, type Web3Error, wrongChain } from '~/modules/web3/core/errors';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

interface UseWeb3PaymentOptions {
  /** Called when the payment completes successfully (after the confirmation grace period). */
  onSuccess?: () => void;
}

interface UseWeb3PaymentReturn {
  address: Readonly<Ref<string | undefined>>;
  connected: ComputedRef<boolean>;
  isExpectedChain: ComputedRef<boolean>;
  isOpen: Readonly<Ref<boolean>>;
  open: () => Promise<void>;
  pay: (isUpgrade: boolean) => Promise<Result<void, Web3Error>>;
  processing: Readonly<Ref<boolean>>;
  switchNetwork: () => Promise<Result<void, Web3Error>>;
  /** Connected wallet's balance of the payment token (human-readable); empty when unknown. */
  balance: Readonly<Ref<string>>;
  /** True while the balance is being (re)read — e.g. right after connecting/switching. */
  balanceLoading: Readonly<Ref<boolean>>;
  fundsStatus: ReturnType<typeof useTokenBalance>['fundsStatus'];
}

export function useWeb3Payment(data: MaybeRefOrGetter<CryptoPayment>, options: UseWeb3PaymentOptions = {}): UseWeb3PaymentReturn {
  const paymentApi = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const logger = useLogger('web3-payment');
  const { logPaymentEvent } = usePaymentLogger();
  const { chronicle } = useSigilEvents();
  const pendingTx = usePendingTx();

  const wallet = useWallet();
  const picker = useWalletPicker();
  const { address, connected, connectedChainId, ensureInitialized, restoreIfPersisted } = wallet;

  const processing = shallowRef<boolean>(false);

  const { start, stop } = useTimeoutFn(() => {
    logger.info('Payment completed, triggering success');
    set(processing, false);
    options.onSuccess?.();
  }, 5000, { immediate: false });

  // Reset the in-flight flag if the wallet disconnects mid-payment.
  watch(connected, (isConnected) => {
    if (!isConnected)
      set(processing, false);
  });

  // Reflect a persisted wallet session on load (no-op without one, and no web3
  // chunk for sessionless / Bitcoin checkouts).
  onMounted(async () => {
    await restoreIfPersisted();
  });

  const isExpectedChain = computed<boolean>(() => wallet.isExpectedChain(toValue(data).chainId));

  // Live balance + funds check for the payment token (skipped for Bitcoin, which
  // never connects a web3 wallet, so `active` stays false there).
  const { fundsStatus, loading: balanceLoading, tokenBalance } = useTokenBalance({
    active: computed<boolean>(() => get(connected) && get(isExpectedChain)),
    chainId: () => toValue(data).chainId,
    estimateGas: async (): Promise<string> => {
      const owner = get(address);
      const payment = toValue(data);
      const { chainId } = payment;
      if (!owner || chainId === undefined)
        return '';

      const client = await getWeb3Client(ensureInitialized);
      const amount = payment.finalPriceInCrypto.toString();
      const tokenDecimals = payment.decimals ?? 18;
      const result = isNativeToken(payment.tokenAddress)
        ? await client.estimateNativeTransferFee({ account: owner, amount, chainId, decimals: tokenDecimals, to: payment.cryptoAddress })
        : await client.estimateErc20TransferFee({ account: owner, amount, chainId, decimals: tokenDecimals, to: payment.cryptoAddress, token: payment.tokenAddress! });
      return getOr(result, '');
    },
    price: () => toValue(data).finalPriceInCrypto.toString(),
    token: () => ({ address: toValue(data).tokenAddress ?? '', decimals: toValue(data).decimals ?? 18 }),
  });

  function fail(error: Web3Error, event: keyof typeof PaymentServerEvents, step: (typeof CheckoutSteps)[keyof typeof CheckoutSteps], isUpgrade: boolean): Result<void, Web3Error> {
    logPaymentEvent({
      errorMessage: error.message || 'unknown',
      event: PaymentServerEvents[event],
      isUpgrade,
      paymentMethod: CheckoutPaymentMethods.CRYPTO,
      step,
    });
    set(processing, false);
    return err(error);
  }

  const pay = async (isUpgrade: boolean): Promise<Result<void, Web3Error>> => {
    if (get(processing))
      return ok(undefined);

    set(processing, true);

    const payment = toValue(data);
    chronicle(SigilEvents.PAYMENT_SUBMITTED, {
      isUpgrade,
      paymentMethod: 'crypto',
      planDuration: monthsToPlanDuration(payment.durationInMonths),
    });

    if (!get(connected))
      return fail(notConnected(), 'CRYPTO_WALLET_NOT_CONNECTED', CheckoutSteps.INIT, isUpgrade);

    assert(payment);
    const { chainId, cryptoAddress, decimals, finalPriceInCrypto, subscriptionId, tokenAddress } = payment;
    assert(chainId);

    if (get(connectedChainId) !== chainId)
      return fail(wrongChain(chainId, get(connectedChainId)), 'CRYPTO_WRONG_CHAIN', CheckoutSteps.VERIFY, isUpgrade);

    stop();
    const amount = finalPriceInCrypto.toString();
    const tokenDecimals = decimals ?? 18;
    logger.info(`preparing to send ${amount} ${payment.cryptocurrency} to ${cryptoAddress}`);

    const client = await getWeb3Client(ensureInitialized);

    const result = isNativeToken(tokenAddress)
      ? await client.sendNativeTransfer({ amount, chainId, decimals: tokenDecimals, to: cryptoAddress })
      : await client.sendErc20Transfer({ amount, chainId, decimals: tokenDecimals, to: cryptoAddress, token: tokenAddress! });

    if (!result.ok) {
      logger.error(result.error.cause ?? result.error);
      return fail(result.error, classifyCryptoTxError(result.error.cause), CheckoutSteps.SUBMIT, isUpgrade);
    }

    const hash = result.value;
    logger.info(`transaction is pending: ${hash}`);

    chronicle(SigilEvents.CRYPTO_TX_SUBMITTED, { asset: payment.cryptocurrency, chainId });

    set(pendingTx, {
      // Full, correctly-formed explorer URL (single source of truth in chains.ts).
      blockExplorerUrl: blockExplorerTxUrl(chainId, hash) ?? '',
      chainId,
      hash,
      isUpgrade,
      subscriptionId: subscriptionId.toString(),
    });
    paymentApi.markTransactionStarted(isUpgrade).catch(error => logger.error('Failed to mark transaction as started:', error));
    requestRefresh();
    start();
    return ok(undefined);
  };

  async function switchNetwork(): Promise<Result<void, Web3Error>> {
    const chainId = toValue(data).chainId;
    if (chainId === undefined)
      return ok(undefined);
    return wallet.switchChain(chainId);
  }

  return {
    address,
    balance: tokenBalance,
    balanceLoading,
    connected,
    fundsStatus,
    isExpectedChain,
    isOpen: picker.isOpen,
    open: picker.open,
    pay,
    processing: shallowReadonly(processing),
    switchNetwork,
  };
}
