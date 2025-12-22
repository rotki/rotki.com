import type { CardPaymentRequest } from '@rotki/card-payment-common/schemas/payment';
import type { Client } from 'braintree-web/client';
import type { PaymentStep, Result } from '~/types';
import { type ActionResultResponse, ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { type PaymentBreakdownResponse, PaymentBreakdownResponseSchema } from '@rotki/card-payment-common/schemas/plans';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { usePlanIdParam } from '~/composables/checkout/use-plan-params';
import { useSelectedPlan } from '~/composables/checkout/use-selected-plan';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { logger } from '~/utils/use-logger';

function useBraintreeInternal() {
  const checkoutData = ref<PaymentBreakdownResponse>();
  const loadingPlan = ref<boolean>(false);
  const pending = ref<boolean>(false);
  const paymentSuccess = ref<boolean>(false);
  const paymentError = ref<string>('');
  const btClient = ref<Client>();
  const clientError = ref<string>();
  const clientInitializing = ref<boolean>(false);

  const { t } = useI18n({ useScope: 'global' });
  const { requestRefresh } = useAccountRefresh();
  const router = useRouter();
  const { fetchWithCsrf } = useFetchWithCsrf();

  const { planId } = usePlanIdParam();

  async function getCheckoutData(planId: number): Promise<Result<PaymentBreakdownResponse>> {
    set(loadingPlan, true);
    try {
      const response = await fetchWithCsrf<PaymentBreakdownResponse>(
        '/webapi/2/payment/breakdown',
        {
          body: convertKeys({ newPlanId: planId, isCryptoPayment: false }, false, false),
          method: 'POST',
        },
      );
      const data = PaymentBreakdownResponseSchema.parse(response);

      return {
        isError: false,
        result: data,
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

  async function loadPlan(planId: number): Promise<void> {
    const data = await getCheckoutData(planId);

    if (data.isError)
      router.back();
    else
      set(checkoutData, data.result);
  }

  const submit = async ({ upgradeSubId, ...payload }: CardPaymentRequest) => {
    set(pending, true);
    try {
      if (isDefined(upgradeSubId)) {
        await fetchWithCsrf<ActionResultResponse>(
          '/webapi/2/braintree/upgrade',
          {
            body: convertKeys({
              ...payload,
              subscriptionId: upgradeSubId,
            }, false, false),
            method: 'POST',
          },
        );
      }
      else {
        await fetchWithCsrf<ActionResultResponse>(
          '/webapi/2/braintree/payments',
          {
            body: convertKeys(payload, false, false),
            method: 'POST',
          },
        );
      }
      requestRefresh();
      set(paymentSuccess, true);
    }
    catch (error_: any) {
      let error = error_;
      if (error_ instanceof FetchError) {
        if (error_.status === 400) {
          error = new Error(ActionResultResponseSchema.parse(error_.data).message);
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

  const reset = (): void => {
    set(pending, false);
    set(paymentSuccess, false);
    set(paymentError, '');
  };

  const token = computed<string>(() => {
    const payload = get(checkoutData);
    if (!payload)
      return '';

    return payload.braintreeClientToken ?? '';
  });

  const nextPayment = computed<number>(() => {
    const payload = get(checkoutData);
    if (!payload)
      return 0;

    return payload.nextPayment;
  });

  // Initialize Braintree client when token is available
  const initializeClient = async (): Promise<void> => {
    const currentToken = get(token);
    if (!currentToken || get(btClient) || get(clientInitializing))
      return;

    set(clientInitializing, true);
    try {
      const { create } = await import('braintree-web/client');
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
    btClient: readonly(btClient),
    clientError: readonly(clientError),
    clientInitializing: readonly(clientInitializing),
    loading: loadingPlan,
    nextPayment,
    pending,
    reset,
    selectedPlan,
    step,
    submit,
    token,
    checkoutData,
  };
}

export const useBraintree = createSharedComposable(useBraintreeInternal);
