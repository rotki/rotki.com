<script setup lang="ts">
withDefaults(
  defineProps<{
    href?: string;
    target?: string;
    rel?: string;
  }>(),
  {
    href: '#',
    target: '_self',
    rel: undefined,
  },
);
</script>

<template>
  <NuxtLink
    :class="$style.link"
    :href="href"
    :target="target"
    :rel="rel"
  >
    <slot />
  </NuxtLink>
</template>

<style module lang="scss">
.link {
  @apply text-rui-primary hover:text-rui-primary-darker font-medium underline;
}
</style>
