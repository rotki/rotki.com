<template>
  <BaseDisplay :message="message" :title="title" status="success">
    <template #icon>
      <CheckCircle height="48px" width="48px" />
    </template>
    <slot />
  </BaseDisplay>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  title: string
}>()
</script>
