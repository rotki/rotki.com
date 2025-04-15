import type { PayEvent } from '~/types/common';
import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import {
  type CardCheckout,
  CardCheckoutResponse,
  type PaymentStep,
  type Result,
  type SelectedPlan,
} from '~/types';
import { fetchWithCsrf } from '~/utils/api';

export function useBraintree() {
  const checkoutData = ref<CardCheckout | null>(null);
  const loadingPlan = ref(false);
  const pending = ref(false);
  const paymentSuccess = ref(false);
  const paymentError = ref('');

  const { t } = useI18n();
  const store = useMainStore();
  const route = useRoute();
  const router = useRouter();

  const step = computed<PaymentStep>(() => {
    const isPending = get(pending);
    const isSuccess = get(paymentSuccess);
    const isFailure = get(paymentError);

    if (isPending) {
      return {
        message: t('subscription.progress.payment_progress_wait'),
        title: t('subscription.progress.payment_progress'),
        type: 'pending',
      };
    }
    else if (isFailure) {
      return {
        message: isFailure,
        title: t('subscription.error.payment_failure'),
        type: 'failure',
      };
    }
    else if (isSuccess) {
      return {
        type: 'success',
      };
    }
    return { type: 'idle' };
  });

  async function cardCheckout(plan: number): Promise<Result<CardCheckout>> {
    try {
      const response = await fetchWithCsrf<CardCheckoutResponse>(
        `/webapi/checkout/card/${plan}/`,
        {
          method: 'GET',
        },
      );
      const data = CardCheckoutResponse.parse(response);
      return {
        isError: false,
        result: data.result,
      };
    }
    catch (error: any) {
      logger.error(error);
      return {
        error,
        isError: true,
      };
    }
  };

  async function loadPlan(months: string) {
    set(loadingPlan, true);
    const plan = parseInt(months);
    const data = await cardCheckout(plan);
    set(loadingPlan, false);
    if (data.isError)
      router.back();
    else
      set(checkoutData, data.result);
  }

  const plan = computed<SelectedPlan | null>(() => {
    const payload = get(checkoutData);
    if (!payload)
      return null;

    const { braintreeClientToken, ...data } = payload;
    return data;
  });

  watchEffect(async () => {
    await loadPlan(route.query.plan as string);
  });

  const token = computed<string>(() => {
    const payload = get(checkoutData);
    if (!payload)
      return '';

    return payload.braintreeClientToken;
  });

  const submit = async ({ months, nonce }: PayEvent) => {
    set(pending, true);
    const result = await store.pay({
      months,
      paymentMethodNonce: nonce,
    });
    if (result.isError)
      set(paymentError, result.error.message);
    else
      set(paymentSuccess, true);

    set(pending, false);
  };

  const reset = () => {
    set(pending, false);
    set(paymentSuccess, false);
    set(paymentError, '');
  };

  return {
    loading: loadingPlan,
    pending,
    plan,
    reset,
    step,
    submit,
    token,
  };
}
