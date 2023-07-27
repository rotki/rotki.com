<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

withDefaults(
  defineProps<{
    to: string;
    external?: boolean;
    inline?: boolean;
  }>(),
  {
    external: false,
    inline: false,
  },
);

const attrs = useAttrs();
</script>

<template>
  <NuxtLink
    class="inline-flex"
    :href="external ? to : undefined"
    :to="external ? undefined : to"
    :target="external ? '_blank' : '_self'"
    :rel="external ? 'noreferrer' : null"
  >
    <RuiButton
      v-bind="{ variant: 'text', ...attrs }"
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
