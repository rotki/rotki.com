<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { useCheckoutMessages } from '../composables/checkout-messages';

const { card } = defineProps<{
  card: Pick<SavedCard, 'imageUrl' | 'last4' | 'expiresAt'>;
}>();

const t = useCheckoutMessages();
</script>

<template>
  <span class="rounded-md bg-rui-grey-50 h-10 w-14 shrink-0 flex items-center justify-center">
    <img
      :src="card.imageUrl"
      :alt="t('checkout.saved_card.image')"
      class="w-full h-full object-contain object-center"
    />
  </span>
  <span class="grow text-left flex flex-col">
    <span class="text-rui-text">{{ t('checkout.saved_card.number', { last4: card.last4 }) }}</span>
    <span class="text-sm text-rui-text-secondary">{{ t('checkout.saved_card.expires', { date: card.expiresAt }) }}</span>
  </span>
</template>
