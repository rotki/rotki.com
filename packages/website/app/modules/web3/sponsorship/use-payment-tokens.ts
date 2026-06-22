import type { PaymentToken, TierKey } from '~/modules/web3/sponsorship/types';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { isNativeToken } from '~/modules/web3/core/erc20';
import { useLogger } from '~/utils/use-logger';

export function usePaymentTokens() {
  const paymentTokens = ref<PaymentToken[]>([]);
  const isLoading = shallowRef<boolean>(false);
  const error = ref<string>();

  const logger = useLogger('payment-tokens');
  const { fetchWithCsrf } = useFetchWithCsrf();

  async function fetchPaymentTokens(): Promise<void> {
    set(isLoading, true);
    set(error, undefined);

    try {
      const response = await fetchWithCsrf<PaymentToken[]>('/webapi/nfts/payment-tokens/');

      // Sort tokens so the native token (ETH) always appears first.
      const sortedTokens = [...response].sort((a, b) => {
        if (isNativeToken(a.address))
          return -1;
        if (isNativeToken(b.address))
          return 1;
        return 0;
      });

      set(paymentTokens, sortedTokens);
      logger.info(`Fetched ${response.length} payment tokens`);
    }
    catch (error_) {
      logger.error('Error fetching payment tokens:', error_);
      set(error, 'Failed to fetch payment tokens');
      throw error_;
    }
    finally {
      set(isLoading, false);
    }
  }

  function getTokenBySymbol(symbol: string): PaymentToken | undefined {
    return get(paymentTokens).find(token => token.symbol === symbol);
  }

  function getPriceForTier(symbol: string, tier: TierKey): string | undefined {
    return getTokenBySymbol(symbol)?.prices[tier];
  }

  return {
    error: shallowReadonly(error),
    fetchPaymentTokens,
    getPriceForTier,
    getTokenBySymbol,
    isLoading: shallowReadonly(isLoading),
    paymentTokens: shallowReadonly(paymentTokens),
  };
}
