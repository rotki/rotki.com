<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id?: string;
  }>(),
  {
    id: undefined,
  },
);

const { headings } = useRuntimeConfig().public.mdc;
const generate = computed(() => props.id && headings?.anchorLinks?.h3);

const css = useCssModule();
</script>

<template>
  <h3
    :id="id"
    :class="css.heading"
  >
    <a
      v-if="generate"
      :href="`#${id}`"
    >
      <slot />
    </a>
    <slot v-else />
  </h3>
</template>

<style lang="scss" module>
.heading {
  @apply text-rui-text font-bold mt-6;
  @apply text-[0.7rem] sm:text-[0.8rem] md:text-[0.9rem] 2xl:text-[1.1rem];
  @apply leading-[1.05rem] sm:leading-[1.2rem] md:leading-[1.35rem] 2xl:leading-[1.65rem];
}
</style>
