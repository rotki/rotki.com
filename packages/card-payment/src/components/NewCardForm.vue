<script setup lang="ts">
import type { Client } from 'braintree-web/client';
import { get, set } from '@vueuse/core';
import { create as createHostedFields, type HostedFields } from 'braintree-web/hosted-fields';
import { computed, onMounted, onUnmounted, reactive, ref, toRefs, watch } from 'vue';

interface Props {
  client: Client;
  disabled?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'tokenize': [result: { nonce: string; bin: string }];
  'validation-change': [isValid: boolean];
  'error': [message: string];
}>();

const { client, disabled } = toRefs(props);

const hostedFields = ref<HostedFields>();
const hostedFieldsInitializing = ref<boolean>(false);
const focusedField = ref<string>('');

interface FieldState {
  valid: boolean;
  touched: boolean;
  hasContent: boolean;
}

const fieldStates = reactive(new Map<string, FieldState>([
  ['number', { valid: false, touched: false, hasContent: false }],
  ['expirationDate', { valid: false, touched: false, hasContent: false }],
  ['cvv', { valid: false, touched: false, hasContent: false }],
]));

function updateFieldState(field: string, updates: Partial<FieldState>): void {
  const current = fieldStates.get(field);
  if (current) {
    fieldStates.set(field, { ...current, ...updates });
  }
}

const fieldErrors = computed(() => ({
  number: fieldStates.get('number')?.touched && !fieldStates.get('number')?.valid,
  expirationDate: fieldStates.get('expirationDate')?.touched && !fieldStates.get('expirationDate')?.valid,
  cvv: fieldStates.get('cvv')?.touched && !fieldStates.get('cvv')?.valid,
}));

const fieldContent = computed(() => ({
  number: fieldStates.get('number')?.hasContent ?? false,
  expirationDate: fieldStates.get('expirationDate')?.hasContent ?? false,
  cvv: fieldStates.get('cvv')?.hasContent ?? false,
}));

const isFormValid = computed<boolean>(() => {
  const numberValid = fieldStates.get('number')?.valid ?? false;
  const expiryValid = fieldStates.get('expirationDate')?.valid ?? false;
  const cvvValid = fieldStates.get('cvv')?.valid ?? false;
  return numberValid && expiryValid && cvvValid;
});

async function initializeHostedFields(): Promise<void> {
  if (get(hostedFields)) {
    return;
  }

  set(hostedFieldsInitializing, true);

  try {
    const fieldsInstance = await createHostedFields({
      client: get(client),
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

function setupHostedFieldsEvents(fieldsInstance: HostedFields): void {
  fieldsInstance.on('focus', (event) => {
    const field = event.emittedBy;
    set(focusedField, field);
    updateFieldState(field, { touched: true });
  });

  fieldsInstance.on('blur', (event) => {
    if (get(focusedField) === event.emittedBy) {
      set(focusedField, '');
    }
  });

  fieldsInstance.on('validityChange', (event) => {
    const field = event.emittedBy;
    const isValid = event.fields[field].isValid;
    updateFieldState(field, { valid: isValid });
  });

  fieldsInstance.on('empty', (event) => {
    updateFieldState(event.emittedBy, { hasContent: false });
  });

  fieldsInstance.on('notEmpty', (event) => {
    updateFieldState(event.emittedBy, { hasContent: true });
  });

  watch(disabled, (isDisabled) => {
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
  <div class="grid grid-rows-2 grid-cols-2 gap-x-4 gap-y-8">
    <!-- Card Number Field (spans 2 columns) -->
    <div class="col-span-2 relative w-full flex items-center">
      <div class="flex items-center shrink-0">
        <div class="ml-3 mr-2">
          <svg
            class="w-6 h-6 text-black/[0.54]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
      </div>
      <div class="flex flex-1 overflow-hidden">
        <!-- Hosted field container for card number -->
        <div
          id="card-number"
          class="leading-6 text-rui-text w-full bg-transparent outline-0 outline-none transition-all h-14 border-b-0 px-3"
        />
        <label
          class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent"
          :class="{
            'leading-tight text-xs -top-5': focusedField === 'number' || fieldContent.number,
            'top-0': focusedField !== 'number' && !fieldContent.number,
            'text-rui-error': fieldErrors.number,
            'text-rui-success': focusedField === 'number' && !fieldErrors.number,
            'pl-3': focusedField !== 'number' && !fieldContent.number,
            'pl-4': focusedField === 'number' || fieldContent.number,
          }"
          :style="{
            paddingLeft: (focusedField === 'number' || fieldContent.number) ? '0.75rem' : 'calc(0.75rem + 2.25rem)',
          }"
        >
          Card Number
        </label>
        <fieldset
          class="absolute w-full top-0 left-0 pointer-events-none rounded border px-2 transition-all -mt-2 h-[calc(100%+0.5rem)]"
          :class="{
            'border-2 border-rui-error': fieldErrors.number,
            'border-2 border-rui-success': focusedField === 'number' && !fieldErrors.number,
            'border border-black/[0.23]': focusedField !== 'number' && !fieldContent.number && !fieldErrors.number,
          }"
        >
          <legend class="opacity-0 text-xs whitespace-break-spaces">
            <span v-if="focusedField === 'number' || fieldContent.number">  Card Number  </span>
            <span v-else>&#8203;</span>
          </legend>
        </fieldset>
      </div>
    </div>

    <!-- Expiration Field -->
    <div class="relative w-full flex items-center">
      <div class="flex flex-1 overflow-hidden">
        <!-- Hosted field container for expiration -->
        <div
          id="expiration"
          class="leading-6 text-rui-text w-full bg-transparent outline-0 outline-none transition-all h-14 border-b-0 px-3"
        />
        <label
          class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent pl-3"
          :class="{
            'leading-tight text-xs -top-5 pl-4': focusedField === 'expirationDate' || fieldContent.expirationDate,
            'top-0': focusedField !== 'expirationDate' && !fieldContent.expirationDate,
            'text-rui-error': fieldErrors.expirationDate,
            'text-rui-success': focusedField === 'expirationDate' && !fieldErrors.expirationDate,
          }"
        >
          MM / YY
        </label>
        <fieldset
          class="absolute w-full top-0 left-0 pointer-events-none rounded border px-2 transition-all -mt-2 h-[calc(100%+0.5rem)]"
          :class="{
            'border-2 border-rui-error': fieldErrors.expirationDate,
            'border-2 border-rui-success': focusedField === 'expirationDate' && !fieldErrors.expirationDate,
            'border border-black/[0.23]': focusedField !== 'expirationDate' && !fieldContent.expirationDate && !fieldErrors.expirationDate,
          }"
        >
          <legend class="opacity-0 text-xs whitespace-break-spaces">
            <span v-if="focusedField === 'expirationDate' || fieldContent.expirationDate">  MM / YY  </span>
            <span v-else>&#8203;</span>
          </legend>
        </fieldset>
      </div>
    </div>

    <!-- CVV Field -->
    <div class="relative w-full flex items-center">
      <div class="flex flex-1 overflow-hidden">
        <!-- Hosted field container for CVV -->
        <div
          id="cvv"
          class="leading-6 text-rui-text w-full bg-transparent outline-0 outline-none transition-all h-14 border-b-0 px-3"
        />
        <label
          class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent pl-3"
          :class="{
            'leading-tight text-xs -top-5 pl-4': focusedField === 'cvv' || fieldContent.cvv,
            'top-0': focusedField !== 'cvv' && !fieldContent.cvv,
            'text-rui-error': fieldErrors.cvv,
            'text-rui-success': focusedField === 'cvv' && !fieldErrors.cvv,
          }"
        >
          CVV
        </label>
        <fieldset
          class="absolute w-full top-0 left-0 pointer-events-none rounded border px-2 transition-all -mt-2 h-[calc(100%+0.5rem)]"
          :class="{
            'border-2 border-rui-error': fieldErrors.cvv,
            'border-2 border-rui-success': focusedField === 'cvv' && !fieldErrors.cvv,
            'border border-black/[0.23]': focusedField !== 'cvv' && !fieldErrors.cvv,
          }"
        >
          <legend class="opacity-0 text-xs whitespace-break-spaces">
            <span v-if="focusedField === 'cvv' || fieldContent.cvv">  CVV  </span>
            <span v-else>&#8203;</span>
          </legend>
        </fieldset>
      </div>
    </div>
  </div>
</template>
