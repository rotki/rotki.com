import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue';
import { watchDebounced } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { getOr } from 'plainfp/result';
import { getWeb3Client } from '~/modules/web3/client';
import { useWallet } from '~/modules/web3/composables/use-wallet';
import { isNativeToken } from '~/modules/web3/core/erc20';
import { computeFundsStatus, type FundsStatus } from '~/modules/web3/core/funds';
import { useLogger } from '~/utils/use-logger';

/** The token the user is paying with — its on-chain address and decimals. */
export interface BalanceToken {
  address: string;
  decimals: number;
}

export interface UseTokenBalanceOptions {
  /** Chain to read balances on (the payment/mint chain, not necessarily the wallet's). */
  chainId: MaybeRefOrGetter<number | undefined>;
  /** Currently selected payment token; `undefined` while none is resolved. */
  token: MaybeRefOrGetter<BalanceToken | undefined>;
  /** Human-readable price/amount to pay in the selected token. */
  price: MaybeRefOrGetter<string>;
  /** Only read while true — typically `connected && isExpectedChain`. */
  active: MaybeRefOrGetter<boolean>;
  /**
   * Flow-specific gas estimate as a human-readable native-coin fee (mint vs
   * transfer differ). Omit to skip the gas warning entirely.
   */
  estimateGas?: () => Promise<string>;
}

export interface UseTokenBalanceReturn {
  /** Balance of the selected token (mirrors the native balance for native tokens). */
  tokenBalance: Readonly<Ref<string>>;
  nativeBalance: Readonly<Ref<string>>;
  /** Latest estimated network fee, in the native coin. */
  estimatedGas: Readonly<Ref<string>>;
  fundsStatus: ComputedRef<FundsStatus>;
  /** True while a balance read is in flight (incl. the debounce window after a switch). */
  loading: Readonly<Ref<boolean>>;
  /** Re-read balances/gas now (e.g. after a confirmed transaction). */
  refresh: () => Promise<void>;
}

/**
 * Reactively reads the connected wallet's native + selected-token balances (and a
 * flow-supplied gas estimate) for the selected chain, then derives a
 * {@link FundsStatus} via the pure `computeFundsStatus` helper. Shared by the
 * sponsorship-mint and checkout crypto-payment flows.
 *
 * Reads are debounced on the inputs that change them (address, chain, token,
 * price) and gated behind `active`, mirroring the allowance-check lifecycle in
 * `use-mint-flow`. All figures are blanked while inactive so the status stays
 * neutral (no false block/warning) until real data lands.
 */
export function useTokenBalance(options: UseTokenBalanceOptions): UseTokenBalanceReturn {
  const tokenBalance = shallowRef<string>('');
  const nativeBalance = shallowRef<string>('');
  const estimatedGas = shallowRef<string>('');
  const loading = shallowRef<boolean>(false);

  const logger = useLogger('token-balance');

  const wallet = useWallet();
  const { address, ensureInitialized } = wallet;

  const isNative = computed<boolean>(() => {
    const token = toValue(options.token);
    return !token || isNativeToken(token.address);
  });

  const fundsStatus = computed<FundsStatus>(() => computeFundsStatus({
    estimatedGas: get(estimatedGas),
    isNative: get(isNative),
    nativeBalance: get(nativeBalance),
    // For native tokens the price is paid from the native balance.
    price: toValue(options.price),
    tokenBalance: get(isNative) ? get(nativeBalance) : get(tokenBalance),
  }));

  function reset(): void {
    set(tokenBalance, '');
    set(nativeBalance, '');
    set(estimatedGas, '');
    set(loading, false);
  }

  /** Whether a real read can run for the current inputs (else everything blanks). */
  function canRead(): boolean {
    return Boolean(toValue(options.active) && get(address) && toValue(options.chainId) !== undefined && toValue(options.token));
  }

  async function refresh(): Promise<void> {
    const owner = get(address);
    const chainId = toValue(options.chainId);
    const token = toValue(options.token);
    if (!toValue(options.active) || !owner || chainId === undefined || !token) {
      reset();
      return;
    }

    set(loading, true);
    try {
      const client = await getWeb3Client(ensureInitialized);

      // Run the independent reads concurrently. The native call doubles as the
      // token balance for native tokens, so it isn't issued twice. Each figure
      // falls back independently (a failed gas estimate shouldn't blank balances).
      const native = client.readNativeBalance({ address: owner, chainId });
      const tokenRead = isNativeToken(token.address)
        ? native
        : client.readErc20Balance({ address: owner, chainId, decimals: token.decimals, token: token.address });
      const gasRead = options.estimateGas ? options.estimateGas() : Promise.resolve('');

      const [nativeResult, tokenResult, gas] = await Promise.all([native, tokenRead, gasRead]);
      set(nativeBalance, getOr(nativeResult, ''));
      set(tokenBalance, getOr(tokenResult, ''));
      set(estimatedGas, gas);
    }
    catch (error_) {
      logger.error('Failed to read token balances:', error_);
    }
    finally {
      set(loading, false);
    }
  }

  // Flip to loading the instant the wallet/chain/token changes — before the
  // debounced read fires — so switching currency shows a spinner instead of the
  // previous token's stale balance during the 300ms window. (Price is excluded:
  // a tier change re-reads the same balance and shouldn't blank it.)
  watch(
    [address, () => toValue(options.chainId), () => toValue(options.token), () => toValue(options.active)],
    () => set(loading, canRead()),
    { immediate: true },
  );

  watchDebounced(
    [address, () => toValue(options.chainId), () => toValue(options.token), () => toValue(options.price), () => toValue(options.active)],
    refresh,
    { debounce: 300, immediate: true },
  );

  return {
    estimatedGas: shallowReadonly(estimatedGas),
    fundsStatus,
    loading: shallowReadonly(loading),
    nativeBalance: shallowReadonly(nativeBalance),
    refresh,
    tokenBalance: shallowReadonly(tokenBalance),
  };
}
