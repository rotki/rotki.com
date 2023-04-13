<script setup lang="ts">
import {
  type HostedFields,
  type ThreeDSecure,
  client,
  hostedFields,
  threeDSecure,
} from 'braintree-web';
import { type ThreeDSecureVerifyOptions } from 'braintree-web/modules/three-d-secure';
import { get, set } from '@vueuse/core';
import { type Ref } from 'vue';
import { type SelectedPlan } from '~/types';
import { type PayEvent } from '~/types/common';
import { logger } from '~/utils/logger';
import { assert } from '~/utils/assert';

type FieldStatus = {
  valid: boolean;
  touched: boolean;
};

type EmptyState = { number: boolean; cvv: boolean; expirationDate: boolean };

const setupEmptyStateMonitoring = (
  hostedFields: HostedFields,
  empty: Ref<EmptyState>
) => {
  hostedFields.on('notEmpty', (event) => {
    const field = event.fields[event.emittedBy];
    set(empty, { ...get(empty), [event.emittedBy]: field.isEmpty });
  });

  hostedFields.on('empty', (event) => {
    const field = event.fields[event.emittedBy];
    set(empty, { ...get(empty), [event.emittedBy]: field.isEmpty });
  });
};

const setupValidityMonitoring = (
  hostedFields: HostedFields,
  {
    cvvStatus,
    expirationDateStatus,
    numberStatus,
  }: {
    numberStatus: Ref<FieldStatus>;
    expirationDateStatus: Ref<FieldStatus>;
    cvvStatus: Ref<FieldStatus>;
  }
) => {
  hostedFields.on('validityChange', (event) => {
    const field = event.emittedBy;
    const valid = event.fields[field].isValid;
    if (field === 'number') {
      set(numberStatus, { ...get(numberStatus), valid });
    } else if (field === 'expirationDate') {
      set(expirationDateStatus, { ...get(expirationDateStatus), valid });
    } else if (field === 'cvv') {
      set(cvvStatus, { ...get(cvvStatus), valid });
    }
  });
};

const setupFocusManagement = (
  hostedFields: HostedFields,
  focused: Ref<string>,
  {
    cvvStatus,
    expirationDateStatus,
    numberStatus,
  }: {
    numberStatus: Ref<FieldStatus>;
    expirationDateStatus: Ref<FieldStatus>;
    cvvStatus: Ref<FieldStatus>;
  }
) => {
  hostedFields.on('focus', (event) => {
    const field = event.emittedBy;
    set(focused, field);
    if (field === 'number') {
      set(numberStatus, { ...get(numberStatus), touched: true });
    } else if (field === 'expirationDate') {
      set(expirationDateStatus, {
        ...get(expirationDateStatus),
        touched: true,
      });
    } else if (field === 'cvv') {
      set(cvvStatus, { ...get(cvvStatus), touched: true });
    }
  });
  hostedFields.on('blur', (event) => {
    if (get(focused) === event.emittedBy) {
      set(focused, '');
    }
  });
};

const hasError = (status: Ref<FieldStatus>) =>
  computed(() => {
    const { touched, valid } = get(status);
    return touched && !valid;
  });

const setupHostedFields = () => {
  let _fields: HostedFields | null = null;

  const get = () => {
    assert(_fields);
    return _fields;
  };

  const create = async (client: braintree.Client) => {
    _fields = await hostedFields.create({
      client,
      styles: {},
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
    }
  ) => {
    setupFocusManagement(get(), focused, status);
    setupEmptyStateMonitoring(get(), empty);
    setupValidityMonitoring(get(), status);
  };

  const focus = (field: 'cvv' | 'expirationDate' | 'number') => {
    _fields?.focus(field);
  };

  return {
    create,
    setup,
    get,
    focus,
    teardown,
  };
};

type ErrorMessage = {
  title: string;
  message: string;
};

const props = defineProps<{
  token: string;
  plan: SelectedPlan;
}>();

const emit = defineEmits<{
  (e: 'pay', payment: PayEvent): void;
  (e: 'update:pending', pending: boolean): void;
}>();

const { token, plan } = toRefs(props);
const fields = setupHostedFields();
const verify = ref(false);
const challengeVisible = ref(false);

const focus = (field: 'cvv' | 'expirationDate' | 'number') => {
  fields.focus(field);
};
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

onMounted(async () => {
  try {
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
  } catch (e: any) {
    set(error, {
      title: 'Initialization Error',
      message: e.message,
    });
  }
});

onUnmounted(() => {
  btThreeDSecure?.teardown();
  fields.teardown();
});

const valid = computed(
  () =>
    get(accepted) &&
    get(numberStatus).valid &&
    get(expirationDateStatus).valid &&
    get(cvvStatus).valid
);
const paying = ref(false);

const updatePending = () => {
  emit('update:pending', true);
};

const submit = async () => {
  set(paying, true);

  const onClose = () => set(challengeVisible, false);
  const onRender = () => set(challengeVisible, true);

  try {
    const selectedPlan = get(plan);
    const token = await fields.get().tokenize();

    const options: ThreeDSecureVerifyOptions = {
      // @ts-ignore
      onLookupComplete(_: any, next: any) {
        next();
      },
      removeFrame: () => updatePending(),
      amount: parseFloat(selectedPlan.finalPriceInEur),
      nonce: token.nonce,
      bin: token.details.bin,
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
    } else {
      const status = (threeDSecureInfo as any)?.status as string | undefined;
      set(error, {
        title: '3D Secure authentication failed',
        message: `The 3D Secure authentication of your card failed (${status?.replaceAll(
          '_',
          ' '
        )}). Please try a different payment method.`,
      });
      logger.error(`liability did not shift, due to status: ${status}`);
    }
  } catch (e: any) {
    set(error, {
      title: 'Payment Error',
      message: e.message,
    });
    logger.error(e);
  } finally {
    set(paying, false);
    set(verify, false);
    set(challengeVisible, false);
    btThreeDSecure.off('authentication-modal-close', onClose);
    btThreeDSecure.off('authentication-modal-render', onRender);
  }
};
const close = () => {
  set(error, null);
};

const css = useCssModule();
</script>

<template>
  <ErrorDisplay v-if="error" :message="error.message" :title="error.title">
    <div :class="css.close">
      <SelectionButton :selected="false" @click="close"> OK </SelectionButton>
    </div>
  </ErrorDisplay>
  <div v-show="!error">
    <div v-show="!verify">
      <div :class="css.inputs">
        <HostedField
          id="card-number"
          :class="css.number"
          :empty="empty.number"
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
          :focused="focused === 'expirationDate'"
          :valid="!expirationError"
          label="Expiration"
          @click="focus('expirationDate')"
        />
        <HostedField
          id="cvv"
          :class="css.cvv"
          :empty="empty.cvv"
          :focused="focused === 'cvv'"
          :valid="!cvvError"
          label="CVV"
          @click="focus('cvv')"
        />
      </div>
      <SelectedPlanOverview :plan="plan" />
      <div>
        <SelectionButton
          :class="css.button"
          :disabled="!valid || paying"
          selected
          @click="submit"
        >
          Start subscription
        </SelectionButton>
      </div>
      <AcceptRefundPolicy v-model="accepted" />
    </div>
    <LoadingIndicator v-if="verify && !challengeVisible" :class="css.loader" />
  </div>
</template>

<style lang="scss" module>
.inputs {
  @apply flex flex-row;

  & > *:not(:first-child) {
    margin-left: 32px;
  }
}

.number {
  width: 328px;
}

.cvv,
.expiration {
  width: 128px;
}

.button {
  margin-top: 51px;
}

.close {
  @apply flex flex-row justify-center mt-4;
}

.loader {
  min-height: 400px;
}
</style>
