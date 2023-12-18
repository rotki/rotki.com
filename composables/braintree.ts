import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import {
  type CardCheckout,
  type PaymentStep,
  type SelectedPlan,
} from '~/types';
import { type PayEvent } from '~/types/common';

export const useBraintree = () => {
  const { t } = useI18n();
  const store = useMainStore();
  const route = useRoute();
  const router = useRouter();
  const checkout = ref<CardCheckout | null>(null);
  const loadingPlan = ref(false);
  const pending = ref(false);
  const paymentSuccess = ref(false);
  const paymentError = ref('');

  const step = computed<PaymentStep>(() => {
    const isPending = get(pending);
    const isSuccess = get(paymentSuccess);
    const isFailure = get(paymentError);

    if (isPending) {
      return {
        type: 'pending',
        title: t('subscription.progress.payment_progress'),
        message: t('subscription.progress.payment_progress_wait'),
      };
    } else if (isFailure) {
      return {
        type: 'failure',
        title: t('subscription.error.payment_failure'),
        message: isFailure,
      };
    } else if (isSuccess) {
      return {
        type: 'success',
      };
    }
    return { type: 'idle' };
  });

  watchEffect(async () => {
    await loadPlan(route.query.plan as string);
  });

  async function loadPlan(months: string) {
    set(loadingPlan, true);
    const plan = parseInt(months);
    const data = await store.checkout(plan);
    set(loadingPlan, false);
    if (data.isError) {
      router.back();
    } else {
      set(checkout, data.result);
    }
  }

  onBeforeMount(async () => {
    await loadPlan(get(route).query.plan as string);
  });

  const plan = computed<SelectedPlan | null>(() => {
    const payload = get(checkout);
    if (!payload) {
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { braintreeClientToken, ...data } = payload;
    return data;
  });

  const token = computed<string>(() => {
    const payload = get(checkout);
    if (!payload) {
      return '';
    }
    return payload.braintreeClientToken;
  });

  const submit = async ({ months, nonce }: PayEvent) => {
    set(pending, true);
    const result = await store.pay({
      months,
      paymentMethodNonce: nonce,
    });
    if (result.isError) {
      set(paymentError, result.error.message);
    } else {
      set(paymentSuccess, true);
    }
    set(pending, false);
  };

  const reset = () => {
    set(pending, false);
    set(paymentSuccess, false);
    set(paymentError, '');
  };

  return {
    plan,
    token,
    step,
    pending,
    loading: loadingPlan,
    submit,
    reset,
  };
};
