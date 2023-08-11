<script setup lang="ts">
withDefaults(
  defineProps<{
    href: string;
    target?: string;
    rel?: string;
  }>(),
  {
    href: '#',
    target: '_self',
    rel: undefined,
  },
);

const css = useCssModule();
</script>

<template>
  <NuxtLink :class="css.link" :href="href" :target="target" :rel="rel">
    <slot />
  </NuxtLink>
</template>

<style module lang="scss">
.link {
  @apply text-rui-primary hover:text-rui-primary-darker font-medium underline;
}
</style>
