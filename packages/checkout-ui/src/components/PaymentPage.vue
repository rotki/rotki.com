<script setup lang="ts">
import { get, set } from '@vueuse/shared';
import { computed, ref } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';

const { title, total, totalNote } = defineProps<{
  /** Page heading; the payment question by default. */
  title?: string;
  /** Amount due, shown on the folded summary bar on phones. */
  total?: string;
  /** Under the total on the phone bar, e.g. what renews after today. */
  totalNote?: string;
}>();

defineSlots<{
  /** Under the heading, e.g. the plan in one sentence. */
  description?: () => any;
  /** An error about the whole page, under the heading and above both columns. */
  alert?: () => any;
  /** The method tiles. */
  methods?: () => any;
  /** The chosen method's own panel: card fields, PayPal note, crypto details. */
  default: () => any;
  /** The order summary card. */
  summary: () => any;
  /** Consent and the pay action, under the summary; a sticky bar on phones. */
  pay?: () => any;
}>();

const t = useCheckoutMessages();

/** Phones only: the summary is folded into a bar with the total until opened. */
const summaryOpen = ref<boolean>(false);

const heading = computed<string>(() => title ?? t('checkout.page.title'));

function toggleSummary(): void {
  set(summaryOpen, !get(summaryOpen));
}
</script>

<template>
  <div
    class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-x-12 lg:gap-y-6 lg:items-start"
    data-testid="payment-page"
  >
    <div
      class="flex flex-col gap-2 lg:col-span-2 lg:row-start-1"
      data-testid="payment-page-heading"
    >
      <h1 class="text-2xl md:text-3xl font-semibold text-rui-text">
        {{ heading }}
      </h1>
      <div
        v-if="$slots.description"
        class="text-rui-text-secondary"
      >
        <slot name="description" />
      </div>
      <slot name="alert" />
    </div>

    <div
      class="flex flex-col gap-6 min-w-0 lg:col-start-1 lg:row-start-2"
      data-testid="payment-page-main"
    >
      <slot name="methods" />
      <slot />
    </div>

    <!-- One column on a desktop so the pay action sits right under the summary; below that the summary goes first and the pay bar last. Edge to edge on phones, cards from md, where the container stops short of the screen edges. -->
    <div class="contents lg:flex lg:flex-col lg:gap-6 lg:col-start-2 lg:row-start-2">
      <aside class="order-first -mx-4 -mt-6 md:m-0 bg-rui-surface border-b border-rui-divider md:border md:rounded-rui-card">
        <button
          type="button"
          class="lg:hidden w-full min-h-16 px-4 md:px-6 py-3 flex items-center justify-between gap-4 text-left"
          :aria-expanded="summaryOpen"
          aria-controls="payment-page-summary"
          data-testid="summary-toggle"
          @click="toggleSummary()"
        >
          <span class="flex items-center gap-1.5 font-medium text-rui-primary">
            {{ t('checkout.page.summary') }}
            <svg
              aria-hidden="true"
              class="size-4 transition-transform"
              :class="{ 'rotate-180': summaryOpen }"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
          <span
            v-if="total"
            class="flex flex-col items-end"
          >
            <span class="text-lg font-semibold text-rui-text tabular-nums">{{ total }}</span>
            <span
              v-if="totalNote"
              class="text-sm text-rui-text-secondary"
            >
              {{ totalNote }}
            </span>
          </span>
        </button>
        <div
          id="payment-page-summary"
          class="px-4 pb-4 md:px-6 md:pb-6 lg:block lg:p-6"
          :class="{ hidden: !summaryOpen }"
          data-testid="payment-page-summary"
        >
          <slot name="summary" />
        </div>
      </aside>

      <div
        v-if="$slots.pay"
        class="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-rui-surface border-t border-rui-divider md:mx-0 md:px-6 md:border-x md:rounded-t-rui-card lg:static lg:p-0 lg:bg-transparent lg:border-0 lg:rounded-none"
        data-testid="payment-page-pay"
      >
        <slot name="pay" />
      </div>
    </div>
  </div>
</template>
