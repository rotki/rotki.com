<script setup lang="ts">
import { useHeadings } from '~/composables/use-headings';

const props = withDefaults(
  defineProps<{
    id?: string;
  }>(),
  {
    id: undefined,
  },
);

const { id } = toRefs(props);

const { generate } = useHeadings(id, 'h3');
</script>

<template>
  <h3
    :id="id"
    class="text-rui-text font-bold mt-6 text-[0.7rem] sm:text-[0.8rem] md:text-[0.9rem] 2xl:text-[1.1rem] leading-[1.05rem] sm:leading-[1.2rem] md:leading-[1.35rem] 2xl:leading-[1.65rem]"
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
