<script setup lang="ts">
import type { Client } from 'braintree-web/client';
import type { HostedFields } from 'braintree-web/hosted-fields';
import { get, set } from '@vueuse/shared';
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';

interface FieldState {
  valid: boolean;
  touched: boolean;
}

type CardFieldKey = 'number' | 'expirationDate' | 'cvv';

interface CardField {
  key: CardFieldKey;
  /** The container Braintree mounts the field's iframe into. */
  id: string;
  label: string;
}

const { client, disabled } = defineProps<{
  client: Client;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'validation-change': [isValid: boolean];
  'error': [message: string];
}>();

const hostedFields = ref<HostedFields>();
const hostedFieldsInitializing = ref<boolean>(false);
const focusedField = ref<string>('');

const fieldStates = reactive(new Map<string, FieldState>([
  ['number', { valid: false, touched: false }],
  ['expirationDate', { valid: false, touched: false }],
  ['cvv', { valid: false, touched: false }],
]));

const cardFields: CardField[] = [
  { key: 'number', id: 'card-number', label: 'Card Number' },
  { key: 'expirationDate', id: 'expiration', label: 'Expiry Date' },
  { key: 'cvv', id: 'cvv', label: 'CVV' },
];

const fieldErrors = computed<Record<string, boolean | undefined>>(() => ({
  number: fieldStates.get('number')?.touched && !fieldStates.get('number')?.valid,
  expirationDate: fieldStates.get('expirationDate')?.touched && !fieldStates.get('expirationDate')?.valid,
  cvv: fieldStates.get('cvv')?.touched && !fieldStates.get('cvv')?.valid,
}));

const isFormValid = computed<boolean>(() => {
  const numberValid = fieldStates.get('number')?.valid ?? false;
  const expiryValid = fieldStates.get('expirationDate')?.valid ?? false;
  const cvvValid = fieldStates.get('cvv')?.valid ?? false;
  return numberValid && expiryValid && cvvValid;
});

/** The label above a field, as RuiFieldLabel draws it. */
function labelClass(key: CardFieldKey): string {
  if (disabled)
    return 'text-rui-text-disabled';
  return get(fieldErrors)[key] ? 'text-rui-error' : 'text-rui-text';
}

/** The field's border, in the states RuiTextField draws: outline, focus ring, error, disabled. */
function fieldsetClass(key: CardFieldKey): string[] {
  if (disabled)
    return ['border-rui-divider'];
  const ring = get(focusedField) === key ? ['ring-3'] : [];
  if (get(fieldErrors)[key])
    return ['border-rui-error ring-rui-error/20', ...ring];
  if (ring.length > 0)
    return ['border-rui-primary ring-rui-primary/20', ...ring];
  return ['border-rui-outline group-hover:border-rui-neutral-500'];
}

async function initializeHostedFields(): Promise<void> {
  if (get(hostedFields)) {
    return;
  }

  set(hostedFieldsInitializing, true);

  try {
    const { create: createHostedFields } = await import('braintree-web/hosted-fields');
    const fieldsInstance = await createHostedFields({
      client,
      styles: {
        'input': {
          'font-size': '14px',
          // The fields live in Braintree's iframe, which cannot load our web fonts: Inter only where installed.
          'font-family': 'Inter,system-ui,sans-serif',
          'color': '#09090b',
        },
        ':disabled': {
          color: '#a1a1aa',
        },
        '::placeholder': {
          color: '#71717a',
        },
        '.invalid': {
          color: '#c42b2b',
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

    setupHostedFieldsEvents(fieldsInstance);
    set(hostedFields, fieldsInstance);
  }
  catch (error: any) {
    emit('error', `Failed to initialize payment form: ${error.message}`);
    console.error(error);
  }
  finally {
    set(hostedFieldsInitializing, false);
  }
}

function updateFieldState(field: string, updates: Partial<FieldState>): void {
  const current = fieldStates.get(field);
  if (current) {
    fieldStates.set(field, { ...current, ...updates });
  }
}

function setupHostedFieldsEvents(fieldsInstance: HostedFields): void {
  fieldsInstance.on('focus', (event) => {
    set(focusedField, event.emittedBy);
  });

  // A field shows an error only once it has been left, not while it is first filled in.
  fieldsInstance.on('blur', (event) => {
    updateFieldState(event.emittedBy, { touched: true });
    if (get(focusedField) === event.emittedBy) {
      set(focusedField, '');
    }
  });

  fieldsInstance.on('validityChange', (event) => {
    const field = event.emittedBy;
    const isValid = event.fields[field].isValid;
    updateFieldState(field, { valid: isValid });
  });

  watch(() => disabled, (isDisabled) => {
    const fields = ['number', 'expirationDate', 'cvv'] as const;

    fields.forEach((field) => {
      if (isDisabled) {
        fieldsInstance.setAttribute({
          field,
          attribute: 'disabled',
          value: true,
        });
      }
      else {
        fieldsInstance.removeAttribute({
          field,
          attribute: 'disabled',
        });
      }
    });
  });
}

async function tokenize(): Promise<{ nonce: string; bin: string }> {
  const fieldsInstance = get(hostedFields);
  if (!fieldsInstance) {
    throw new Error('Hosted fields not initialized');
  }

  const { nonce, details } = await fieldsInstance.tokenize();
  return { nonce, bin: details.bin };
}

// Expose tokenize method to parent

// Watch form validity and emit changes
watch(isFormValid, (valid) => {
  emit('validation-change', valid);
}, { immediate: true });

onMounted(async () => {
  await initializeHostedFields();
});

onUnmounted(async () => {
  try {
    const fieldsInstance = get(hostedFields);
    await fieldsInstance?.teardown();
    set(hostedFields, undefined);
  }
  catch (error) {
    console.error('Error during hosted fields cleanup:', error);
  }
});

defineExpose({
  tokenize,
});
</script>

<template>
  <div class="grid grid-cols-2 gap-4">
    <div
      v-for="field in cardFields"
      :key="field.key"
      :class="{ 'col-span-2': field.key === 'number' }"
    >
      <span
        class="block mb-1 text-sm leading-5 font-medium"
        :class="labelClass(field.key)"
      >
        {{ field.label }}
      </span>
      <div
        class="group relative flex items-center rounded-rui-control"
        :class="disabled ? 'bg-rui-neutral-50' : 'bg-white'"
      >
        <svg
          v-if="field.key === 'number'"
          class="ml-3 size-4 shrink-0 text-rui-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.75"
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <div
          :id="field.id"
          class="h-9 flex-1 px-3"
        />
        <fieldset
          class="absolute top-0 left-0 w-full h-full min-w-0 rounded-rui-control pointer-events-none transition-all border transform-gpu"
          :class="fieldsetClass(field.key)"
        />
      </div>
    </div>
  </div>
</template>
