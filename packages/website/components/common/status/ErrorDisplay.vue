<script setup lang="ts">
import BaseDisplay from '~/components/common/status/BaseDisplay.vue';
import AlertIcon from '~/components/icons/AlertIcon.vue';

defineProps<{
  title: string;
  message: string;
}>();
</script>

<template>
  <BaseDisplay
    :message="message"
    :title="title"
    status="error"
  >
    <template #icon>
      <AlertIcon
        height="48px"
        width="48px"
        color="white"
      />
    </template>
    <slot />
  </BaseDisplay>
</template>
