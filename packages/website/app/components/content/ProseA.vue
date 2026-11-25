<script setup lang="ts">
import { NuxtLink } from '#components';

const { href = '#', target = '_self' } = defineProps<{
  href?: string;
  target?: string;
  rel?: string;
}>();

defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <NuxtLink
    class="text-rui-primary hover:text-rui-primary-darker font-medium underline"
    :href="href"
    :target="target"
    :rel="rel"
  >
    <slot />
  </NuxtLink>
</template>
