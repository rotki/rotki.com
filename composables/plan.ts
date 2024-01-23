import { get } from '@vueuse/core';

const availablePlans = [1, 3, 6, 12];

export const supportedCurrencies = ['ETH', 'BTC', 'DAI'] as const;

export type Currency = (typeof supportedCurrencies)[number];

type CurrencyParam = Currency | null;

export const usePlanParams = () => {
  const route = useRoute();
  const plan = computed(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { plan } = route.query;
    if (typeof plan !== 'string') {
      return -1;
    }
    const selectedPlan = parseInt(plan);
    if (
      isNaN(selectedPlan) ||
      !isFinite(selectedPlan) ||
      !availablePlans.includes(selectedPlan)
    ) {
      return -1;
    }
    return selectedPlan;
  });

  return { plan };
};

export const useCurrencyParams = () => {
  const route = useRoute();
  const currency = computed<CurrencyParam>(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { currency } = route.query;
    if (typeof currency !== 'string' || !isSupported(currency)) {
      return null;
    }
    return currency as Currency;
  });

  const isSupported = (value: string) =>
    supportedCurrencies.includes(value as Currency);

  return { currency, isSupportedCrypto: isSupported };
};

export const useSubscriptionIdParam = () => {
  const route = useRoute();
  const subscriptionId = computed(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const query = get(route).query;
    return typeof query.id === 'string' ? query.id : undefined;
  });
  return { subscriptionId };
};

export const usePaymentMethodParam = () => {
  const route = useRoute();
  const paymentMethodId = computed(() => {
    // NB: this param name is also used in backend email links,
    // if changed, kindly sync with backend team to update email links as well.
    const { method } = get(route).query;
    return typeof method === 'string' ? Number(method) : -1;
  });
  return { paymentMethodId };
};
