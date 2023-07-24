<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string;
  }>(),
  {
    id: undefined,
  },
);

const { anchorLinks } = useRuntimeConfig().public.content;
const heading = 2;

const generate =
  anchorLinks?.depth >= heading && !anchorLinks?.exclude.includes(heading);

const css = useCssModule();
</script>

<template>
  <h2 :id="id" :class="css.heading">
    <a v-if="id && generate" :href="`#${id}`">
      <slot />
    </a>
    <slot v-else />
  </h2>
</template>

<style lang="scss" module>
.heading {
  @apply text-rui-text font-bold mt-6;
  @apply text-[1.05rem] sm:text-[1.2rem] md:text-[1.35rem] 2xl:text-[1.5rem];
  @apply leading-[1.4rem] sm:leading-[1.6rem] md:leading-[1.8rem] 2xl:leading-[2.2rem];
}
</style>
