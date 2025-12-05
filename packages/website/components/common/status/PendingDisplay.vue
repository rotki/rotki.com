<script setup lang="ts">
import RippleLoader from '~/components/common/loaders/RippleLoader.vue';
import BaseDisplay from '~/components/common/status/BaseDisplay.vue';

defineProps<{ message: string; title: string }>();
</script>

<template>
  <BaseDisplay
    :message="message"
    :title="title"
    status="neutral"
  >
    <template #icon>
      <RippleLoader />
    </template>
    <slot />
  </BaseDisplay>
</template>
