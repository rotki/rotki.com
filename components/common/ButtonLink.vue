<script setup lang="ts">
import type { ContextColorsType } from '@rotki/ui-library';
import type { RouteLocationRaw } from 'vue-router';
import { get } from '@vueuse/core';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  to: RouteLocationRaw;
  external?: boolean;
  inline?: boolean;
  highlightActive?: boolean;
  highlightExactActive?: boolean;
  color?: ContextColorsType;
  icon?: boolean;
  disabled?: boolean;
}>(), {
  external: false,
  inline: false,
  highlightActive: false,
  highlightExactActive: false,
  color: undefined,
  icon: undefined,
  disabled: undefined,
});

const { highlightActive, highlightExactActive } = toRefs(props);

function getColor(active: boolean, exact: boolean) {
  if ((get(highlightActive) && active) || (get(highlightExactActive) && exact)) {
    return 'primary';
  }

  return undefined;
}
</script>

<template>
  <NuxtLink
    #default="link"
    :class="{ 'inline-flex': inline }"
    :to="to"
    :external="external"
    :target="external ? '_blank' : '_self'"
  >
    <RuiButton
      v-bind="{
        variant: 'text',
        type: 'button',
        color: color ?? getColor(link?.isActive, link?.isExactActive),
        icon,
        disabled,
        ...$attrs,
      }"
      :class="{ ['inline-flex py-0 !px-1 !text-[1em]']: inline }"
    >
      <slot>
        {{ link?.href }}
      </slot>
      <template #append>
        <slot name="append" />
      </template>
    </RuiButton>
  </NuxtLink>
</template>
