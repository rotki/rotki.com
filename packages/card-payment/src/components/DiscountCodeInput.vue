<script setup lang="ts">
import type { PaymentBreakdownDiscount, ValidPaymentBreakdownDiscount } from '@rotki/card-payment-common/schemas/plans';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { get, set } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

const model = defineModel<string>({ required: true });

const {
  discountInfo,
  hint = 'Optional: Enter a discount code to apply savings to your purchase.',
} = defineProps<{
  discountInfo?: PaymentBreakdownDiscount;
  loading?: boolean;
  hint?: string;
}>();

const emit = defineEmits<{
  /** The buyer applied a code, or removed one (empty string). */
  edit: [code: string];
}>();

const value = ref<string>('');
const focused = ref<boolean>(false);

function isValidDiscount(info: PaymentBreakdownDiscount | undefined): info is ValidPaymentBreakdownDiscount {
  return !!(info && info.isValid);
}

function isInvalidDiscount(info: PaymentBreakdownDiscount | undefined): info is PaymentBreakdownDiscount & { isValid: false } {
  return !!(info && !info.isValid);
}

const isApplied = computed<boolean>(() => isValidDiscount(discountInfo));

const hasError = computed<boolean>(() => isInvalidDiscount(discountInfo));

/** The field's border, in the states RuiTextField draws: outline, focus ring, error. */
const fieldsetClass = computed<string[]>(() => {
  const ring = get(focused) ? ['ring-3'] : [];
  if (get(hasError))
    return ['border-rui-error ring-rui-error/20', ...ring];
  if (ring.length > 0)
    return ['border-rui-primary ring-rui-primary/20', ...ring];
  return ['border-rui-outline group-hover:border-rui-neutral-500'];
});

const errorMessage = computed<string>(() => {
  const info = discountInfo;
  return isInvalidDiscount(info) ? info.error : '';
});

const appliedDiscountAmount = computed<string>(() => {
  const info = discountInfo;
  return isValidDiscount(info) && info.discountType === DiscountType.PERCENTAGE && info.discountAmount
    ? `${info.discountAmount}% off`
    : '';
});

function applyCode(): void {
  const code = get(value);
  if (code) {
    set(model, code);
    emit('edit', code);
  }
}

function reset(): void {
  set(model, '');
  set(value, '');
  emit('edit', '');
}

/** Editing the input after a rejected code clears the error by resetting the model. */
function clearErrorOnEdit(newValue: string): void {
  if (newValue !== get(model) && get(hasError)) {
    set(model, '');
  }
}

// Sync internal value with model
watch(model, (modelValue) => {
  set(value, modelValue);
}, { immediate: true });

watch(value, clearErrorOnEdit);
</script>

<template>
  <div class="space-y-2">
    <!-- Input Form (shown when no valid discount is applied) -->
    <form
      v-if="!isApplied"
      @submit.prevent="applyCode()"
    >
      <label
        for="discount-code"
        class="block mb-1 text-sm leading-5 font-medium"
        :class="hasError ? 'text-rui-error' : 'text-rui-text'"
      >
        Discount/Referral Code
      </label>
      <div class="group relative flex items-center rounded-rui-control bg-white">
        <svg
          class="ml-3 size-4 shrink-0 text-rui-neutral-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.75"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        <input
          id="discount-code"
          v-model="value"
          type="text"
          class="w-full bg-transparent px-3 py-1.5 text-sm/6 text-rui-text outline-hidden"
          :disabled="loading"
          @focus="focused = true"
          @blur="focused = false"
        />
        <button
          v-if="hasError"
          type="button"
          class="mr-1 p-1.5 shrink-0 text-rui-neutral-500 hover:text-rui-error hover:bg-rui-error-soft rounded-full transition-colors"
          aria-label="Clear discount code"
          @click="reset()"
        >
          <svg
            class="size-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.75"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <button
          v-else
          type="submit"
          :disabled="!value || loading"
          class="mr-1 px-3 py-0.5 shrink-0 text-sm/6 font-medium rounded-rui-control transition-colors"
          :class="value && !loading ? 'bg-rui-primary text-white hover:bg-rui-primary-darker' : 'bg-rui-surface-muted text-rui-text-disabled cursor-not-allowed'"
        >
          <span v-if="loading">...</span>
          <span v-else>Apply Code</span>
        </button>
        <fieldset
          class="absolute top-0 left-0 w-full h-full min-w-0 rounded-rui-control pointer-events-none transition-all border transform-gpu"
          :class="fieldsetClass"
        />
      </div>
      <p
        class="mt-1 text-xs"
        :class="hasError ? 'text-rui-error' : 'text-rui-text-secondary'"
      >
        {{ hasError ? errorMessage : hint }}
      </p>
    </form>

    <!-- Applied Discount Display -->
    <div v-else>
      <div
        class="flex items-center justify-between p-3 border border-rui-success-border bg-rui-success-subtle rounded-rui-control"
      >
        <div class="flex-1">
          <div class="flex items-center gap-1">
            <span class="text-xs text-rui-text-secondary">
              {{ isValidDiscount(discountInfo) && discountInfo.isReferral ? 'Referral code applied:' : 'Discount code applied:' }}
            </span>
            <span class="text-xs font-bold uppercase">
              {{ model }}
            </span>
          </div>
          <div class="text-sm font-semibold text-rui-success">
            <template v-if="isValidDiscount(discountInfo)">
              You save {{ discountInfo.discountedAmount }} €
              <template v-if="appliedDiscountAmount">
                ({{ appliedDiscountAmount }})
              </template>
            </template>
          </div>
        </div>

        <!-- Remove button -->
        <button
          type="button"
          class="p-1.5 text-rui-neutral-500 hover:text-rui-error hover:bg-rui-error-soft rounded-full transition-colors"
          aria-label="Remove discount"
          @click="reset()"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div class="text-xs text-rui-text-secondary mt-2">
        * Applies to first payment only
      </div>
    </div>
  </div>
</template>
