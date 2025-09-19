import type {
  CardCheckout,
  PaymentStep,
  SelectedPlan,
} from '~/types';
import type { PayEvent } from '~/types/common';
import { get, set } from '@vueuse/core';
import { type Client, create } from 'braintree-web/client';
import { useAccountRefresh } from '~/composables/use-app-events';
import { usePaymentApi } from '~/composables/use-payment-api';

function useBraintreeInternal() {
  const { t } = useI18n({ useScope: 'global' });
  const paymentApi = usePaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const route = useRoute();
  const router = useRouter();
  const checkout = ref<CardCheckout | null>(null);
  const loadingPlan = ref<boolean>(false);
  const pending = ref<boolean>(false);
  const paymentSuccess = ref<boolean>(false);
  const paymentError = ref<string>('');
  const btClient = ref<Client>();
  const clientError = ref<string>();
  const clientInitializing = ref<boolean>(false);

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

  watchEffect(() => {
    loadPlan(route.query.plan as string).catch((error) => {
      logger.error('Failed to load plan:', error);
    });
  });

  async function loadPlan(months: string) {
    set(loadingPlan, true);
    const plan = parseInt(months);
    const data = await paymentApi.checkout(plan);
    set(loadingPlan, false);
    if (data.isError)
      router.back();
    else
      set(checkout, data.result);
  }

  const plan = computed<SelectedPlan | null>(() => {
    const payload = get(checkout);
    if (!payload)
      return null;

    const { braintreeClientToken, ...data } = payload;
    return data;
  });

  const token = computed<string>(() => {
    const payload = get(checkout);
    if (!payload)
      return '';

    return payload.braintreeClientToken;
  });

  // Initialize Braintree client when token is available
  const initializeClient = async () => {
    const currentToken = get(token);
    if (!currentToken || get(btClient) || get(clientInitializing))
      return;

    set(clientInitializing, true);
    try {
      const newClient = await create({
        authorization: currentToken,
      });
      set(btClient, newClient);
    }
    catch (error: any) {
      set(clientError, error.message);
    }
    finally {
      set(clientInitializing, false);
    }
  };

  // Watch for token changes to initialize client
  watch(token, async (newToken) => {
    if (newToken && !get(btClient)) {
      await initializeClient();
    }
  }, { immediate: true });

  const submit = async ({ months, nonce }: PayEvent) => {
    set(pending, true);
    const result = await paymentApi.pay({
      months,
      paymentMethodNonce: nonce,
    });
    // Request account refresh after payment
    requestRefresh();

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
    btClient: readonly(btClient),
    clientError: readonly(clientError),
    clientInitializing: readonly(clientInitializing),
    loading: loadingPlan,
    pending,
    plan,
    reset,
    step,
    submit,
    token,
  };
}

export const useBraintree = createSharedComposable(useBraintreeInternal);
