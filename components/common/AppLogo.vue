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
      class="transition delay-1000"
    />
    <template #fallback>
      <RuiLogo
        class="opacity-0 invisible transition delay-1000"
        :text="text"
        v-bind="attrs"
      />
    </template>
  </ClientOnly>
</template>
