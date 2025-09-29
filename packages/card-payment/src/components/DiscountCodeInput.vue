<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import {
  type DiscountInfo,
  DiscountInfoSchema,
  DiscountType,
  type InvalidDiscountInfo,
  type ValidDiscountInfo,
} from '@rotki/card-payment-common/schemas/discount';
import { get, set, watchImmediate } from '@vueuse/core';
import { computed, ref, toRefs, watch } from 'vue';
import { fetchWithCSRF } from '@/utils/api';

const model = defineModel<string>({ required: true });

const discountInfo = defineModel<DiscountInfo | undefined>('discountInfo', { required: true });

const props = defineProps<{
  selectedPlan: SelectedPlan;
}>();

const { selectedPlan } = toRefs(props);

const value = ref<string>('');
const loading = ref<boolean>(false);
const focused = ref<boolean>(false);

// Type guards for discriminated union
function isValidDiscount(info: DiscountInfo | undefined): info is ValidDiscountInfo {
  return !!(info && info.isValid);
}

function isInvalidDiscount(info: DiscountInfo | undefined): info is InvalidDiscountInfo {
  return !!(info && !info.isValid);
}

const isApplied = computed<boolean>(() => {
  const info = get(discountInfo);
  return isValidDiscount(info);
});

const hasError = computed<boolean>(() => {
  const info = get(discountInfo);
  return isInvalidDiscount(info);
});

const errorMessage = computed<string>(() => {
  const info = get(discountInfo);
  return isInvalidDiscount(info) ? info.error : '';
});

const appliedDiscountAmount = computed<string>(() => {
  const info = get(discountInfo);
  if (!isValidDiscount(info))
    return '';

  if (info.discountType === DiscountType.PERCENTAGE && info.discountAmount) {
    return `${info.discountAmount}% off`;
  }

  return info.discountedAmount.toFixed(2) || '';
});

async function fetchDiscountInfo(discountValue: string): Promise<void> {
  const { planId } = get(selectedPlan);
  set(loading, true);
  try {
    const response = await fetchWithCSRF(`/webapi/2/discounts`, {
      method: 'POST',
      body: JSON.stringify({
        discountCode: discountValue,
        planId,
      }),
    });

    const parsed = DiscountInfoSchema.parse(response);
    set(discountInfo, parsed);
  }
  catch (error: any) {
    set(discountInfo, {
      isValid: false,
      error: error.message || 'Invalid discount code',
    });
  }
  finally {
    set(loading, false);
  }
}

function reset(): void {
  set(model, '');
  set(discountInfo, undefined);
}

// Sync with external model
watch(discountInfo, (info) => {
  const internalValue = get(value);
  if (info && info.isValid && internalValue) {
    set(model, internalValue);
  }
});

watch(model, (modelValue) => {
  set(value, modelValue);
});

// Auto-validate when component mounts with existing discount code
watchImmediate([model, discountInfo], async ([modelValue, info]) => {
  if (modelValue && !info) {
    await fetchDiscountInfo(modelValue);
  }
});

// Re-validate when plan changes
watch(selectedPlan, async () => {
  const modelVal = get(model);
  if (modelVal && get(discountInfo)) {
    await fetchDiscountInfo(modelVal);
  }
});

// Clear invalid discount info when input changes
watch(value, () => {
  const info = get(discountInfo);
  if (info && !info.isValid) {
    set(discountInfo, undefined);
  }
});
</script>

<template>
  <div class="space-y-2">
    <!-- Input Form (shown when no valid discount is applied) -->
    <form
      v-if="!isApplied"
      class="space-y-2"
      @submit.prevent="fetchDiscountInfo(value)"
    >
      <div class="relative w-full flex items-center">
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
            class="left-0 text-base leading-[3.5] text-rui-text-secondary pointer-events-none absolute flex h-full w-full select-none transition-all border-0 border-transparent"
            :class="{
              'leading-tight text-xs -top-5': value || focused,
              'top-0': !value && !focused,
              'text-rui-error': hasError,
              'text-rui-primary': focused && !hasError,
              'text-rui-success': !hasError && value && !focused,
              'pl-3': !value && !focused,
              'pl-4': value || focused,
            }"
            :style="{
              paddingLeft: (value || focused) ? '0.75rem' : 'calc(0.75rem + 2.25rem)',
            }"
          >
            Discount Code
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
              <span v-if="value || focused">  Discount Code  </span>
              <span v-else>&#8203;</span>
            </legend>
          </fieldset>
        </div>
        <button
          type="submit"
          :disabled="!value || loading"
          class="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 text-sm font-medium rounded transition-colors z-10"
          :class="{
            'bg-gray-300 text-gray-500 cursor-not-allowed': !value || loading,
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
        class="text-xs text-red-600 ml-[3.25rem]"
      >
        {{ errorMessage }}
      </p>

      <!-- Hint -->
      <p class="text-xs text-gray-500 ml-[3.25rem]">
        Enter a valid discount code to reduce your total
      </p>
    </form>

    <!-- Applied Discount Display -->
    <div
      v-else
      class="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md"
    >
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="text-xs text-gray-600">Applied:</span>
          <span class="text-xs font-bold uppercase text-green-700">
            {{ model }}
          </span>
        </div>
        <div class="text-sm font-semibold text-green-600">
          <template v-if="isValidDiscount(discountInfo)">
            You save {{ discountInfo.discountedAmount }}
            <template v-if="appliedDiscountAmount">
              ({{ appliedDiscountAmount }})
            </template>
          </template>
        </div>
      </div>

      <!-- Remove button -->
      <button
        class="p-1 text-gray-500 hover:text-red-600 focus:outline-none"
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
  </div>
</template>
