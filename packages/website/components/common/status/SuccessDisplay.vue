<script setup lang="ts">
import BaseDisplay from '~/components/common/status/BaseDisplay.vue';
import CheckCircle from '~/components/icons/CheckCircle.vue';

defineProps<{
  message: string;
  title: string;
}>();
</script>

<template>
  <BaseDisplay
    :message="message"
    :title="title"
    status="success"
  >
    <template #icon>
      <CheckCircle
        height="48px"
        width="48px"
      />
    </template>
    <slot />
  </BaseDisplay>
</template>
