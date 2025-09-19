<script setup lang="ts">
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
