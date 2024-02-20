<script setup lang="ts">
import {
  type HostedFields,
  type ThreeDSecure,
  client,
  hostedFields,
  threeDSecure,
} from 'braintree-web';
import { get, set } from '@vueuse/core';
import { logger } from '~/utils/logger';
import { assert } from '~/utils/assert';
import type { ThreeDSecureVerifyOptions } from 'braintree-web/three-d-secure';
import type { Ref } from 'vue';
import type { HostedFieldsHostedFieldsFieldName } from 'braintree-web/hosted-fields';
import type { PaymentStep, SelectedPlan } from '~/types';
import type { PayEvent } from '~/types/common';

interface FieldStatus {
  valid: boolean;
  touched: boolean;
}

interface EmptyState { number: boolean; cvv: boolean; expirationDate: boolean }

const props = defineProps<{
  token: string;
  plan: SelectedPlan;
  success: boolean;
  failure: boolean;
  pending: boolean;
  loading: boolean;
  status: PaymentStep;
}>();

const emit = defineEmits<{
  (e: 'pay', payment: PayEvent): void;
  (e: 'update:pending', pending: boolean): void;
  (e: 'clear:errors'): void;
}>();

const { t } = useI18n();
const { paymentMethodId } = usePaymentMethodParam();

function setupEmptyStateMonitoring(hostedFields: HostedFields, empty: Ref<EmptyState>) {
  hostedFields.on('notEmpty', (event) => {
    const field = event.fields[event.emittedBy];
    set(empty, { ...get(empty), [event.emittedBy]: field.isEmpty });
  });

  hostedFields.on('empty', (event) => {
    const field = event.fields[event.emittedBy];
    set(empty, { ...get(empty), [event.emittedBy]: field.isEmpty });
  });
}

function setupValidityMonitoring(hostedFields: HostedFields, {
  cvvStatus,
  expirationDateStatus,
  numberStatus,
}: {
  numberStatus: Ref<FieldStatus>;
  expirationDateStatus: Ref<FieldStatus>;
  cvvStatus: Ref<FieldStatus>;
}) {
  hostedFields.on('validityChange', (event) => {
    const field = event.emittedBy;
    const valid = event.fields[field].isValid;
    if (field === 'number')
      set(numberStatus, { ...get(numberStatus), valid });
    else if (field === 'expirationDate')
      set(expirationDateStatus, { ...get(expirationDateStatus), valid });
    else if (field === 'cvv')
      set(cvvStatus, { ...get(cvvStatus), valid });
  });
}

function setupFocusManagement(hostedFields: HostedFields, focused: Ref<string>, {
  cvvStatus,
  expirationDateStatus,
  numberStatus,
}: {
  numberStatus: Ref<FieldStatus>;
  expirationDateStatus: Ref<FieldStatus>;
  cvvStatus: Ref<FieldStatus>;
}) {
  hostedFields.on('focus', (event) => {
    const field = event.emittedBy;
    set(focused, field);
    if (field === 'number') {
      set(numberStatus, { ...get(numberStatus), touched: true });
    }
    else if (field === 'expirationDate') {
      set(expirationDateStatus, {
        ...get(expirationDateStatus),
        touched: true,
      });
    }
    else if (field === 'cvv') {
      set(cvvStatus, { ...get(cvvStatus), touched: true });
    }
  });
  hostedFields.on('blur', (event) => {
    if (get(focused) === event.emittedBy)
      set(focused, '');
  });
}

function hasError(status: Ref<FieldStatus>) {
  return computed(() => {
    const { touched, valid } = get(status);
    return touched && !valid;
  });
}

function setupHostedFields() {
  let _fields: HostedFields | null = null;

  const getFields = () => {
    assert(_fields);
    return _fields;
  };

  const create = async (client: braintree.Client) => {
    _fields = await hostedFields.create({
      client,
      styles: {
        'body': {
          'font-size': '16px',
        },
        'input': {
          'font-size': '1rem',
          'font-family': 'Roboto',
          'color': 'rgba(0, 0, 0, 0.87)',
        },
        ':disabled': {
          color: 'rgba(0, 0, 0, 0.5)',
        },
        '.invalid': {
          color: 'red',
        },
      },
      fields: {
        number: {
          container: '#card-number',
        },
        cvv: {
          container: '#cvv',
        },
        expirationDate: {
          container: '#expiration',
        },
      },
    });
    watch(processing, (val) => {
      const hostedFields: HostedFieldsHostedFieldsFieldName[] = [
        'number',
        'expirationDate',
        'cvv',
      ];
      if (val) {
        hostedFields.forEach((field) => {
          _fields?.setAttribute({
            field,
            attribute: 'disabled',
            value: true,
          });
        });
      }
      else {
        hostedFields.forEach((field) => {
          _fields?.removeAttribute({
            field,
            attribute: 'disabled',
          });
        });
      }
    });
  };

  const teardown = () => {
    _fields?.teardown();
  };

  const setup = (
    focused: Ref<string>,
    empty: Ref<EmptyState>,
    status: {
      numberStatus: Ref<FieldStatus>;
      expirationDateStatus: Ref<FieldStatus>;
      cvvStatus: Ref<FieldStatus>;
    },
  ) => {
    setupFocusManagement(getFields(), focused, status);
    setupEmptyStateMonitoring(getFields(), empty);
    setupValidityMonitoring(getFields(), status);
  };

  const focus = (field: 'cvv' | 'expirationDate' | 'number') => {
    _fields?.focus(field);
  };

  return {
    create,
    setup,
    get: getFields,
    focus,
    teardown,
  };
}

interface ErrorMessage {
  title: string;
  message: string;
}

const { token, plan, success, pending, loading } = toRefs(props);
const fields = setupHostedFields();
const verify = ref(false);
const challengeVisible = ref(false);
const paying = ref(false);
const initializing = ref(true);

const accepted = ref(false);
const defaultStatus: FieldStatus = {
  valid: false,
  touched: false,
};
const numberStatus = ref<FieldStatus>(defaultStatus);
const expirationDateStatus = ref<FieldStatus>(defaultStatus);
const cvvStatus = ref<FieldStatus>(defaultStatus);

const numberError = hasError(numberStatus);
const expirationError = hasError(expirationDateStatus);
const cvvError = hasError(cvvStatus);

const empty = ref({
  number: true,
  cvv: true,
  expirationDate: true,
});

const focused = ref('');
const error = ref<ErrorMessage | null>(null);

let btThreeDSecure: ThreeDSecure;

const valid = computed(
  () =>
    get(accepted)
    && get(numberStatus).valid
    && get(expirationDateStatus).valid
    && get(cvvStatus).valid,
);

const processing = logicOr(paying, loading, pending);
const disabled = logicOr(processing, initializing, success);

function focus(field: 'cvv' | 'expirationDate' | 'number') {
  fields.focus(field);
}

function updatePending() {
  emit('update:pending', true);
}

async function back() {
  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      plan: get(plan).months,
      method: get(paymentMethodId),
    },
  });
}

async function submit() {
  set(paying, true);

  const onClose = () => set(challengeVisible, false);
  const onRender = () => set(challengeVisible, true);

  try {
    const selectedPlan = get(plan);
    const token = await fields.get().tokenize();

    const options: ThreeDSecureVerifyOptions = {
      // @ts-expect-error type is missing
      onLookupComplete(_: any, next: any) {
        next();
      },
      removeFrame: () => updatePending(),
      amount: selectedPlan.finalPriceInEur,
      nonce: token.nonce,
      bin: token.details.bin,
      challengeRequested: true,
    };
    set(verify, true);

    btThreeDSecure.on('authentication-modal-close', onClose);
    btThreeDSecure.on('authentication-modal-render', onRender);

    const payload = await btThreeDSecure.verifyCard(options);
    set(challengeVisible, false);

    const threeDSecureInfo = payload.threeDSecureInfo;
    if (threeDSecureInfo.liabilityShifted) {
      const months = get(plan).months;
      assert(months);
      emit('pay', {
        months,
        nonce: payload.nonce,
      });
    }
    else {
      const status = (threeDSecureInfo as any)?.status as string | undefined;
      set(error, {
        title: t('subscription.error.3d_auth_failed'),
        message: t('subscription.error.3d_auth_failed_message', {
          status: status?.replaceAll('_', ' '),
        }),
      });
      logger.error(`liability did not shift, due to status: ${status}`);
    }
  }
  catch (error_: any) {
    set(error, {
      title: t('subscription.error.payment_error'),
      message: error_.message,
    });
    logger.error(error_);
  }
  finally {
    set(paying, false);
    set(verify, false);
    set(challengeVisible, false);
    btThreeDSecure.off('authentication-modal-close', onClose);
    btThreeDSecure.off('authentication-modal-render', onRender);
  }
}

function clearError() {
  set(error, null);
}

function redirect() {
  stopWatcher();
  // redirect happens outside of router to force reload for csp.
  const url = new URL(`${window.location.origin}/checkout/success`);
  window.location.href = url.toString();
}

const stopWatcher = watchEffect(() => {
  if (get(success))
    redirect();
});

onMounted(async () => {
  try {
    set(initializing, true);
    const btClient = await client.create({
      authorization: get(token),
    });

    await fields.create(btClient);
    fields.setup(focused, empty, {
      numberStatus,
      expirationDateStatus,
      cvvStatus,
    });

    btThreeDSecure = await threeDSecure.create({
      version: '2',
      client: btClient,
    });
    set(initializing, false);
  }
  catch (error_: any) {
    set(error, {
      title: t('subscription.error.init_error'),
      message: error_.message,
    });
  }
});

onUnmounted(() => {
  btThreeDSecure?.teardown();
  fields.teardown();
});

const css = useCssModule();
</script>

<template>
  <div class="my-6 grow flex flex-col">
    <div :class="css.inputs">
      <HostedField
        id="card-number"
        :class="css.number"
        :empty="empty.number"
        :disabled="disabled"
        :focused="focused === 'number'"
        :valid="!numberError"
        label="Card Number"
        number
        @click="focus('number')"
      />
      <HostedField
        id="expiration"
        :class="css.expiration"
        :empty="empty.expirationDate"
        :disabled="disabled"
        :focused="focused === 'expirationDate'"
        :valid="!expirationError"
        label="Expiration"
        @click="focus('expirationDate')"
      />
      <HostedField
        id="cvv"
        :class="css.cvv"
        :empty="empty.cvv"
        :disabled="disabled"
        :focused="focused === 'cvv'"
        :valid="!cvvError"
        label="CVV"
        @click="focus('cvv')"
      />
    </div>
    <SelectedPlanOverview
      :plan="plan"
      :disabled="disabled"
    />
    <AcceptRefundPolicy
      v-model="accepted"
      :disabled="disabled"
      :class="css.policy"
    />
    <div
      v-if="pending"
      class="my-8"
    >
      <RuiAlert type="info">
        <template #title>
          {{ status?.title }}
        </template>
        <span>{{ status?.message }}</span>
      </RuiAlert>
    </div>
    <div :class="css.buttons">
      <RuiButton
        :disabled="processing || success"
        class="w-full"
        size="lg"
        @click="back()"
      >
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!valid"
        :loading="disabled"
        class="w-full"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('home.plans.tiers.step_3.start') }}
      </RuiButton>
    </div>
  </div>

  <FloatingNotification
    :timeout="10000"
    :visible="!!error"
    closeable
    @dismiss="clearError()"
  >
    <template #title>
      {{ error?.title }}
    </template>
    {{ error?.message }}
  </FloatingNotification>

  <FloatingNotification
    :timeout="10000"
    :visible="failure"
  >
    <template #title>
      {{ status?.title }}
    </template>
    {{ status?.message }}
  </FloatingNotification>
</template>

<style lang="scss" module>
.inputs {
  @apply grid grid-rows-2 grid-cols-2 gap-x-4 gap-y-12;
}

.number {
  @apply col-span-2;
}

.close {
  @apply flex flex-row justify-center mt-4;
}

.loader {
  min-height: 400px;
}

.policy {
  @apply my-8;
}

.buttons {
  @apply flex gap-4 justify-center w-full mt-auto;
}
</style>
