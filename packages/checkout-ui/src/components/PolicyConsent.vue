<script setup lang="ts">
import { useCheckoutMessages } from '../composables/checkout-messages';

const accepted = defineModel<boolean>({ required: true });

const { policyHref, disabled = false } = defineProps<{
  /** Address of the refund and cancellation policy, which opens in a new tab. */
  policyHref: string;
  disabled?: boolean;
}>();

const t = useCheckoutMessages();
</script>

<template>
  <label
    class="flex items-start gap-3 min-h-11 py-2 text-sm text-rui-text cursor-pointer has-[:disabled]:cursor-not-allowed"
    data-cy="policy-consent"
  >
    <input
      v-model="accepted"
      type="checkbox"
      class="mt-0.5 size-5 shrink-0 accent-rui-primary cursor-pointer disabled:cursor-not-allowed"
      :disabled="disabled"
    />
    <span>
      {{ t('checkout.consent.agree') }}
      <a
        :href="policyHref"
        target="_blank"
        rel="noopener"
        class="text-rui-primary underline underline-offset-2 hover:text-rui-primary-darker"
      >
        {{ t('checkout.consent.policy') }}
      </a>
    </span>
  </label>
</template>
