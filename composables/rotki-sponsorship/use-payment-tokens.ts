import type { PaymentToken } from '~/composables/rotki-sponsorship/types';
import { get, set } from '@vueuse/core';
import { useLogger } from '~/utils/use-logger';

export function usePaymentTokens() {
  const paymentTokens = ref<PaymentToken[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  const logger = useLogger('payment-tokens');

  function formatPrice(price: string): string {
    // Remove unnecessary trailing zeros after decimal point
    const num = parseFloat(price);
    if (isNaN(num))
      return price;

    // Convert to string and remove scientific notation if needed
    let formatted = num.toFixed(18);

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
    set(error, null);

    try {
      const response = await $fetch<PaymentToken[]>('/webapi/nfts/payment-tokens/');
      set(paymentTokens, response);
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

  const getPriceForTier = computed<(symbol: string, tier: 'bronze' | 'silver' | 'gold') => string | undefined>(() => (symbol: string, tier: 'bronze' | 'silver' | 'gold') => {
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
