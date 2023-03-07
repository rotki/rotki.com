<template>
  <h3 :id="id" :class="css.heading">
    <a v-if="id && generate" :href="`#${id}`">
      <slot />
    </a>
    <slot v-else />
  </h3>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    id?: string
  }>(),
  {
    id: undefined,
  }
)

const { anchorLinks } = useRuntimeConfig().public.content
const heading = 3

const generate =
  anchorLinks?.depth >= heading && !anchorLinks?.exclude.includes(heading)

const css = useCssModule()
</script>

<style lang="scss" module>
.heading {
  @apply font-serif text-primary2 font-bold mt-6;
  @apply text-[0.7rem] sm:text-[0.8rem] md:text-[0.9rem] 2xl:text-[1.1rem];
  @apply leading-[1.05rem] sm:leading-[1.2rem] md:leading-[1.35rem] 2xl:leading-[1.65rem];
}
</style>
