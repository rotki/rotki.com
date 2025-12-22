<script setup lang="ts">
import type { PaymentBreakdownDiscount, ValidPaymentBreakdownDiscount } from '@rotki/card-payment-common/schemas/plans';
import { DiscountType } from '@rotki/card-payment-common';
import { get, set } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

const model = defineModel<string>({ required: true });

const props = defineProps<{
  discountInfo?: PaymentBreakdownDiscount;
  loading?: boolean;
}>();

const value = ref<string>('');
const focused = ref<boolean>(false);

// Type guards for discriminated union
function isValidDiscount(info: PaymentBreakdownDiscount | undefined): info is ValidPaymentBreakdownDiscount {
  return !!(info && info.isValid);
}

function isInvalidDiscount(info: PaymentBreakdownDiscount | undefined): info is PaymentBreakdownDiscount & { isValid: false } {
  return !!(info && !info.isValid);
}

const isApplied = computed<boolean>(() => isValidDiscount(props.discountInfo));

const hasError = computed<boolean>(() => isInvalidDiscount(props.discountInfo));

const errorMessage = computed<string>(() => {
  const info = props.discountInfo;
  return isInvalidDiscount(info) ? info.error : '';
});

const appliedDiscountAmount = computed<string>(() => {
  const info = props.discountInfo;
  return isValidDiscount(info) && info.discountType === DiscountType.PERCENTAGE && info.discountAmount
    ? `${info.discountAmount}% off`
    : '';
});

function applyCode(): void {
  const code = get(value);
  if (code) {
    set(model, code);
  }
}

function reset(): void {
  set(model, '');
  set(value, '');
}

// Sync internal value with model
watch(model, (modelValue) => {
  set(value, modelValue);
}, { immediate: true });

// Clear error state when input changes
watch(value, (newValue) => {
  // If user is typing and there's an error, clear it by resetting model
  if (newValue !== get(model) && hasError.value) {
    set(model, '');
  }
});
</script>

<template>
  <div class="space-y-2">
    <!-- Input Form (shown when no valid discount is applied) -->
    <form
      v-if="!isApplied"
      class="space-y-2"
      @submit.prevent="applyCode()"
    >
      <div class="relative w-full flex items-center">
        <div class="flex items-center shrink-0">
          <div class="ml-3">
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
          </div>
        </div>
        <div class="flex flex-1 overflow-hidden">
          <!-- Input field -->
          <input
            v-model="value"
            type="text"
            class="leading-6 text-rui-text w-full bg-transparent outline-0 outline-none transition-all h-14 border-b-0 px-3"
            :disabled="loading"
            @focus="focused = true"
            @blur="focused = false"
          />
          <label
            class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent pl-12"
            :class="{
              'leading-tight text-xs -top-5': value || focused,
              'top-0': !value && !focused,
              'text-rui-error': hasError,
              'text-rui-primary': focused && !hasError,
              'text-rui-success': !hasError && value && !focused,
              '!pl-4': value || focused,
            }"
          >
            Discount/Referral Code
          </label>
          <fieldset
            class="absolute w-full top-0 left-0 pointer-events-none rounded border px-2 transition-all -mt-2 h-[calc(100%+0.5rem)]"
            :class="{
              'border-2 border-rui-error': hasError,
              'border-2 border-rui-success': !hasError && value && !focused,
              'border-2 border-rui-primary': focused && !hasError,
              'border border-black/[0.23]': !value && !hasError && !focused,
            }"
          >
            <legend class="opacity-0 text-xs whitespace-break-spaces">
              <span v-if="value || focused">{{ '  Discount/Referral Code  ' }}</span>
              <span v-else>&#8203;</span>
            </legend>
          </fieldset>
        </div>
        <button
          type="submit"
          :disabled="!value || loading"
          class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-sm font-medium rounded transition-colors z-10"
          :class="{
            'bg-gray-300 text-neutral-500 cursor-not-allowed': !value || loading,
            'bg-rui-primary text-white hover:bg-rui-primary-darker': value && !loading,
          }"
        >
          <span v-if="loading">...</span>
          <span v-else>Apply Code</span>
        </button>
      </div>

      <!-- Error message -->
      <p
        v-if="hasError"
        class="text-xs leading-3 text-red-600 ml-2"
      >
        {{ errorMessage }}
      </p>

      <!-- Hint -->
      <p
        v-else
        class="text-xs leading-3 text-neutral-500 ml-2"
      >
        Optional. Enter a discount code to apply savings to your purchase.
      </p>
    </form>

    <!-- Applied Discount Display -->
    <div v-else>
      <div
        class="flex items-center justify-between p-3 border border-green-700 rounded-md"
      >
        <div class="flex-1">
          <div class="flex items-center gap-1">
            <span class="text-xs text-neutral-500">
              {{ isValidDiscount(discountInfo) && discountInfo.isReferral ? 'Referral code applied:' : 'Discount code applied:' }}
            </span>
            <span class="text-xs font-bold uppercase">
              {{ model }}
            </span>
          </div>
          <div class="text-sm font-semibold text-green-700">
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
          class="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-100 rounded-full !outline-none transition-all"
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
      <div class="text-xs text-neutral-500 mt-2">
        * Applies to first payment only
      </div>
    </div>
  </div>
</template>
