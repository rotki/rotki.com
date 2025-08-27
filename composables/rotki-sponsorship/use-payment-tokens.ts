import type { PaymentToken, TierKey } from '~/composables/rotki-sponsorship/types';
import { get, set } from '@vueuse/core';
import { ETH_ADDRESS } from '~/composables/rotki-sponsorship/constants';
import { useLogger } from '~/utils/use-logger';

export function usePaymentTokens() {
  const paymentTokens = ref<PaymentToken[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string>();

  const logger = useLogger('payment-tokens');

  function formatPrice(price: string): string {
    // Remove unnecessary trailing zeros after decimal point
    const num = parseFloat(price);
    if (isNaN(num))
      return price;

    // Convert to string
    let formatted = num.toString();

    // Remove trailing zeros after decimal point
    formatted = formatted.replace(/\.?0+$/, '');

    // If it's a whole number, add .0 to maintain decimal format
    if (!formatted.includes('.')) {
      formatted += '.0';
    }

    return formatted;
  }

  async function fetchPaymentTokens(): Promise<void> {
    set(isLoading, true);
    set(error, undefined);

    try {
      const response = await $fetch<PaymentToken[]>('/webapi/nfts/payment-tokens/');

      // Sort tokens to ensure ETH appears first
      const sortedTokens = [...response].sort((a, b) => {
        // ETH should always be first
        if (a.address === ETH_ADDRESS)
          return -1;
        if (b.address === ETH_ADDRESS)
          return 1;
        // Keep the original order for other tokens
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

  const getTokenBySymbol = computed<(symbol: string) => PaymentToken | undefined>(() => (symbol: string) => get(paymentTokens).find(token => token.symbol === symbol));

  const getPriceForTier = computed<(symbol: string, tier: TierKey) => string | undefined>(() => (symbol: string, tier: TierKey) => {
    const token = get(getTokenBySymbol)(symbol);
    const price = token?.prices[tier];
    return price ? formatPrice(price) : undefined;
  });

  return {
    error: readonly(error),
    fetchPaymentTokens,
    getPriceForTier,
    getTokenBySymbol,
    isLoading: readonly(isLoading),
    paymentTokens: readonly(paymentTokens),
  };
}
