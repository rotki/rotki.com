<script setup lang="ts">
import type { HostedFieldsHostedFieldsFieldName } from 'braintree-web/hosted-fields';
import type { Ref } from 'vue';
import { get, set } from '@vueuse/core';
import { type Client, type HostedFields, hostedFields } from 'braintree-web';
import { assert } from '~/utils/assert';

interface FieldStatus {
  valid: boolean;
  touched: boolean;
}

interface EmptyState { number: boolean; cvv: boolean; expirationDate: boolean }

interface ErrorMessage {
  title: string;
  message: string;
}

const props = defineProps<{
  disabled: boolean;
  processing: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:error', error: ErrorMessage): void;
  (e: 'update:form-valid', valid: boolean): void;
  (e: 'update:initializing', initializing: boolean): void;
}>();

function updateError(error: ErrorMessage) {
  emit('update:error', error);
}

function updateFormValid(valid: boolean) {
  emit('update:form-valid', valid);
}

function updateInitializing(valid: boolean) {
  emit('update:initializing', valid);
}

const { processing } = toRefs(props);
const { btClient: client } = useBraintree();

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

  const create = async (client: Client) => {
    _fields = await hostedFields.create({
      client,
      styles: {
        'body': {
          'font-size': '16px',
        },
        'input': {
          'font-size': '1rem',
          'font-family': 'Roboto,sans-serif',
          'color': 'rgba(0, 0, 0, 0.87)',
        },
        ':disabled': {
          color: 'rgba(0, 0, 0, 0.5)',
        },
        'input:not(:focus)::placeholder': {
          color: 'transparent',
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
          placeholder: 'MM / YY',
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

const fields = setupHostedFields();

const { t } = useI18n({ useScope: 'global' });

onMounted(async () => {
  try {
    updateInitializing(true);
    const currentClient = get(client);
    if (!currentClient) {
      throw new Error('Braintree client not available');
    }
    await fields.create(currentClient);
    fields.setup(focused, empty, {
      numberStatus,
      expirationDateStatus,
      cvvStatus,
    });
  }
  catch (error_: any) {
    updateError({
      title: t('subscription.error.init_error'),
      message: error_.message,
    });
  }
  finally {
    updateInitializing(false);
  }
});

function focus(field: 'cvv' | 'expirationDate' | 'number') {
  fields.focus(field);
}

const valid = computed(() => get(numberStatus).valid
  && get(expirationDateStatus).valid
  && get(cvvStatus).valid);

watchImmediate(valid, (valid) => {
  updateFormValid(valid);
});

onUnmounted(() => {
  fields.teardown();
});

async function submit() {
  const { nonce, details: { bin } } = await fields.get().tokenize();

  return { nonce, bin };
}

defineExpose({ submit });
</script>

<template>
  <div :class="$style.inputs">
    <HostedField
      id="card-number"
      :class="$style.number"
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
      :class="$style.expiration"
      :empty="empty.expirationDate"
      :disabled="disabled"
      :focused="focused === 'expirationDate'"
      :valid="!expirationError"
      label="Expiration"
      @click="focus('expirationDate')"
    />
    <HostedField
      id="cvv"
      :class="$style.cvv"
      :empty="empty.cvv"
      :disabled="disabled"
      :focused="focused === 'cvv'"
      :valid="!cvvError"
      label="CVV"
      @click="focus('cvv')"
    />
  </div>
</template>

<style lang="scss" module>
.inputs {
  @apply grid grid-rows-2 grid-cols-2 gap-x-4 gap-y-8;
}

.number {
  @apply col-span-2;
}
</style>
