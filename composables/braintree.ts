import { get, set } from '@vueuse/core';
import { useMainStore } from '~/store';
import {
  type CardCheckout,
  type PaymentStep,
  type SelectedPlan,
} from '~/types';
import { type PayEvent } from '~/types/common';

export const useBraintree = () => {
  const store = useMainStore();
  const route = useRoute();
  const router = useRouter();
  const checkout = ref<CardCheckout | null>(null);
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
        title: 'Payment in progress',
        message: 'Please wait while your payment is processed...',
      };
    } else if (isFailure) {
      return { type: 'failure', title: 'Payment Failure', message: isFailure };
    } else if (isSuccess) {
      return {
        type: 'success',
        title: 'Payment Success',
        message:
          'Your payment was processed successfully. Visit the account management page to manage your account.',
      };
    }
    return { type: 'idle' };
  });

  watch(route, async (route) => await loadPlan(route.query.p as string));

  async function loadPlan(months: string) {
    const plan = parseInt(months);
    const data = await store.checkout(plan);
    if (data.isError) {
      router.back();
    } else {
      set(checkout, data.result);
    }
  }

  onBeforeMount(async () => {
    await loadPlan(get(route).query.p as string);
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
  return {
    plan,
    token,
    step,
    pending,
    submit,
  };
};
