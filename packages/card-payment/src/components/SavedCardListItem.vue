<script setup lang="ts">
import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';

const { card, selected = false, disabled = false } = defineProps<{
  card: SavedCard;
  selected?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  select: [];
}>();

function handleClick(): void {
  if (!disabled) {
    emit('select');
  }
}
</script>

<template>
  <button
    type="button"
    class="w-full p-4 flex items-center gap-4 border rounded-md transition-all hover:border-rui-primary"
    :class="[
      selected ? 'border-rui-primary bg-rui-primary/5' : 'border-rui-grey-300',
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    ]"
    :disabled="disabled"
    @click="handleClick()"
  >
    <span class="rounded-md bg-rui-grey-50 h-10 w-14 flex items-center justify-center">
      <img
        :src="card.imageUrl"
        alt="Card image"
        class="w-full h-full object-contain object-center"
      />
    </span>
    <span class="grow text-left flex flex-col">
      <span class="text-rui-text">
        •••• •••• •••• {{ card.last4 }}
      </span>
      <span class="text-sm text-rui-text-secondary">
        Expires {{ card.expiresAt }}
      </span>
    </span>
    <svg
      v-if="selected"
      class="w-5 h-5 text-rui-primary"
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fill-rule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clip-rule="evenodd"
      />
    </svg>
  </button>
</template>
