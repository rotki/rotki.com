<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    id?: string;
  }>(),
  {
    id: undefined,
  },
);

const { id } = toRefs(props);

const { generate } = useHeadings(id, 'h2');
const css = useCssModule();
</script>

<template>
  <h2
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
  </h2>
</template>

<style lang="scss" module>
.heading {
  @apply text-rui-text font-bold mt-8 mb-6;
  @apply text-[1.05rem] sm:text-[1.2rem] md:text-[1.35rem] 2xl:text-[1.5rem];
  @apply leading-[1.4rem] sm:leading-[1.6rem] md:leading-[1.8rem] 2xl:leading-[2.2rem];
}
</style>
