<script setup lang="ts">
import { routes } from '@/utils/navigation';

interface Props {
  disabled?: boolean;
}

const acceptedTerms = defineModel<boolean>('acceptedTerms', { required: true });

const { disabled = false } = defineProps<Props>();
</script>

<template>
  <div class="my-8">
    <label class="flex items-center cursor-pointer">
      <input
        v-model="acceptedTerms"
        type="checkbox"
        class="h-5 w-5 accent-rui-primary border-2 border-rui-grey-300 rounded focus:ring-rui-primary"
        :disabled="disabled"
      />
      <span class="ml-3 text-body-2 text-rui-text-secondary">
        I have read and agreed to the
        <a
          :href="routes.refundPolicy"
          target="_blank"
          class="text-rui-primary hover:text-rui-primary-darker underline"
        >
          Refunds/Cancellation Policy
        </a>
      </span>
    </label>
  </div>
</template>
