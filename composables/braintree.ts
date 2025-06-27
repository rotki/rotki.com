import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useMainStore } from '~/store';
import {
  ActionResultResponse,
  type CardCheckout,
  CardCheckoutResponse,
  type CardPaymentRequest,
  type PaymentStep,
  type Result,
} from '~/types';
import { fetchWithCsrf } from '~/utils/api';

export function useBraintree() {
  const checkoutData = ref<CardCheckout | null>(null);
  const loadingPlan = ref(false);
  const pending = ref(false);
  const paymentSuccess = ref(false);
  const paymentError = ref('');

  const { t } = useI18n({ useScope: 'global' });
  const { refreshSubscriptionsAndPayments } = useMainStore();
  const router = useRouter();

  const { planId } = usePlanIdParam();

  async function getCardCheckoutData(planId: number): Promise<Result<CardCheckout>> {
    set(loadingPlan, true);
    try {
      const response = await fetchWithCsrf<CardCheckoutResponse>(
        `/webapi/2/braintree/payments`,
        {
          body: {
            planId,
          },
          method: 'PUT',
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
    finally {
      set(loadingPlan, false);
    }
  }

  async function loadPlan(planId: number) {
    const data = await getCardCheckoutData(planId);
    if (data.isError)
      router.back();
    else
      set(checkoutData, data.result);
  }

  const submit = async (payload: CardPaymentRequest) => {
    set(pending, true);
    try {
      await fetchWithCsrf<ActionResultResponse>(
        '/webapi/2/braintree/payments',
        {
          body: payload,
          method: 'POST',
        },
      );
      refreshSubscriptionsAndPayments();
      set(paymentSuccess, true);
    }
    catch (error_: any) {
      let error = error_;
      if (error_ instanceof FetchError) {
        if (error_.status === 400) {
          error = new Error(ActionResultResponse.parse(error_.data).message);
        }
        else if (error_.status === 403) {
          error = '';
        }
      }
      logger.error(error_);
      set(paymentError, error.message);
    }
    finally {
      set(pending, false);
    }
  };

  const reset = () => {
    set(pending, false);
    set(paymentSuccess, false);
    set(paymentError, '');
  };

  const token = computed<string>(() => {
    const payload = get(checkoutData);
    if (!payload)
      return '';

    return payload.braintreeClientToken;
  });

  const nextPayment = computed<number>(() => {
    const payload = get(checkoutData);
    if (!payload)
      return 0;

    return payload.nextPayment;
  });

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
    (async () => {
      const planIdVal = get(planId);
      if (!planIdVal) {
        await router.push({ name: 'checkout-pay' });
        return;
      }

      await loadPlan(planIdVal);
    })();
  });

  const { selectedPlan } = useSelectedPlan();

  return {
    loading: loadingPlan,
    nextPayment,
    pending,
    reset,
    selectedPlan,
    step,
    submit,
    token,
  };
}
