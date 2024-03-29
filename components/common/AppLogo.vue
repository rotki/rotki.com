<script setup lang="ts">
import { EXTERNAL_LOGO } from '~/utils/external-links';

withDefaults(
  defineProps<{
    src?: string;
    text?: boolean;
  }>(),
  {
    src: EXTERNAL_LOGO,
    text: false,
  },
);

const attrs = useAttrs();
</script>

<template>
  <ClientOnly>
    <RuiLogo
      :text="text"
      :custom-src="src"
      v-bind="attrs"
    />
    <template #fallback>
      <RuiLogo
        :text="text"
        v-bind="attrs"
      />
    </template>
  </ClientOnly>
</template>
