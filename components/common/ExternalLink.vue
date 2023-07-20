<script setup lang="ts">
import { RuiButton } from '@rotki/ui-library';

const props = withDefaults(
  defineProps<{
    url: string;
    text?: string;
    sameTab?: boolean;
    noRef?: boolean;
  }>(),
  {
    text: '',
    sameTab: false,
    noRef: false,
  },
);

const { text, url } = toRefs(props);
const display = computed(() => (text.value ? text.value : url.value));

const attrs = useAttrs();
</script>

<template>
  <NuxtLink
    :href="url"
    :target="sameTab ? '_self' : '_blank'"
    :rel="noRef ? 'noreferrer' : null"
  >
    <RuiButton v-bind="attrs" variant="text">
      <slot>
        {{ display }}
      </slot>
    </RuiButton>
  </NuxtLink>
</template>
