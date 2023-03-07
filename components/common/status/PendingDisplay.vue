<script setup lang="ts">
defineProps<{ message: string; title: string }>();
</script>

<template>
  <BaseDisplay :message="message" :title="title" status="neutral">
    <template #icon>
      <RippleLoader />
    </template>
    <slot />
  </BaseDisplay>
</template>
