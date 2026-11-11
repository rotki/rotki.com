<script setup lang="ts">
import { useCheckoutMessages } from '../composables/checkout-messages';

const { billingHref } = defineProps<{
  /** The account page where the buyer can correct the VAT ID. */
  billingHref: string;
}>();

const t = useCheckoutMessages();
</script>

<template>
  <p
    class="p-3 rounded-rui-control border border-rui-warning-border bg-rui-warning-subtle text-sm text-rui-warning-darker"
  >
    {{ t('checkout.vat.invalid') }}
    <a
      :href="billingHref"
      class="font-medium underline"
    >
      {{ t('checkout.vat.billing') }}
    </a>.
  </p>
</template>
