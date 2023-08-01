<script setup lang="ts">
import { get } from '@vueuse/core';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(
  defineProps<{
    to: string;
    external?: boolean;
    inline?: boolean;
    highlightActive?: boolean;
    highlightExactActive?: boolean;
  }>(),
  {
    external: false,
    inline: false,
    highlightActive: false,
    highlightExactActive: false,
  },
);

const attrs = useAttrs();

const { highlightActive, highlightExactActive } = toRefs(props);

const getColor = (active: boolean, exact: boolean) => {
  if (
    (get(highlightActive) && active) ||
    (get(highlightExactActive) && exact)
  ) {
    return 'primary';
  }

  return undefined;
};
</script>

<template>
  <NuxtLink
    #default="link"
    class="inline-flex"
    :href="external ? to : undefined"
    :to="external ? undefined : to"
    :target="external ? '_blank' : '_self'"
    :rel="external ? 'noreferrer' : null"
  >
    <RuiButton
      v-bind="{
        variant: 'text',
        type: 'button',
        color: getColor(link?.isActive, link?.isExactActive),
        ...attrs,
      }"
      :class="{ ['inline-flex py-0 !px-1 !text-[1em]']: inline }"
    >
      <slot>
        {{ to }}
      </slot>
      <template #append>
        <slot name="append" />
      </template>
    </RuiButton>
  </NuxtLink>
</template>
