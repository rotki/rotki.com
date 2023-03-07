<template>
  <h2
    :id="id"
    :class="{
      [css.heading]: !subheading,
      [css.subheading]: subheading,
      [css.secondary]: secondary,
      [css['no-margin']]: noMargin,
    }"
  >
    <a v-if="id && generate" :href="`#${id}`">
      <slot />
    </a>
    <slot v-else />
  </h2>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from '#imports'

withDefaults(
  defineProps<{
    id?: string
    subheading?: boolean
    noMargin?: boolean
    secondary?: boolean
  }>(),
  {
    id: undefined,
    subheading: false,
    noMargin: false,
    secondary: false,
  }
)

const { anchorLinks } = useRuntimeConfig().public.content
const heading = 2

const generate =
  anchorLinks?.depth >= heading && !anchorLinks?.exclude.includes(heading)

const css = useCssModule()
</script>

<style lang="scss" module>
.heading {
  @apply font-serif text-primary2 font-bold text-2xl;

  &:not(.no-margin) {
    @apply mt-6;
  }
}

.secondary {
  @apply font-serif text-primary2 font-bold text-xl;
  @apply text-[1.05rem] sm:text-[1.2rem] md:text-[1.35rem] 2xl:text-[1.65rem];
  @apply leading-[1.4rem] sm:leading-[1.6rem] md:leading-[1.8rem] 2xl:leading-[2.2rem];

  &:not(.no-margin) {
    @apply mt-6;
  }
}

.subheading {
  @apply font-serif text-primary2 font-medium text-lg;

  &:not(.no-margin) {
    @apply mt-4;
  }
}
</style>
