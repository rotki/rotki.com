<script setup lang="ts">
import { get } from '@vueuse/shared';
import { nextTick, onMounted, useTemplateRef, watch } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';

const { title, message } = defineProps<{
  title?: string;
  message: string;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const t = useCheckoutMessages();

const root = useTemplateRef<HTMLDivElement>('root');

/** Moves focus to the error, so keyboard and screen reader users land on it. */
async function focusAlert(): Promise<void> {
  await nextTick();
  get(root)?.focus();
}

watch(() => message, async () => {
  await focusAlert();
});

onMounted(async () => {
  await focusAlert();
});
</script>

<template>
  <div
    ref="root"
    role="alert"
    tabindex="-1"
    class="flex items-start gap-3 p-4 rounded-rui-control border border-rui-error-border bg-rui-error-subtle text-sm text-rui-error-darker outline-hidden"
    data-testid="checkout-alert"
  >
    <svg
      aria-hidden="true"
      class="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      viewBox="0 0 24 24"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M12 8v4m0 4h.01" />
    </svg>
    <div class="flex-1 flex flex-col gap-0.5">
      <p
        v-if="title"
        class="font-medium"
      >
        {{ title }}
      </p>
      <p class="whitespace-break-spaces">
        {{ message }}
      </p>
    </div>
    <button
      type="button"
      class="shrink-0 hover:opacity-70"
      :aria-label="t('checkout.alert.dismiss')"
      @click="emit('dismiss')"
    >
      <svg
        aria-hidden="true"
        class="size-4"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>
