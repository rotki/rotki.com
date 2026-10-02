<script setup lang="ts">
import { useStagingBranding } from '~/composables/use-staging-branding';

defineOptions({
  inheritAttrs: false,
});

const { text = false, size } = defineProps<{
  text?: boolean;
  size?: string | number;
}>();

const { isStaging } = useStagingBranding();
</script>

<template>
  <RuiLogo
    :text="text"
    :logo="isStaging ? undefined : 'website'"
    :src="isStaging ? '/staging/logo.svg' : undefined"
    :size="size"
    v-bind="$attrs"
  />
</template>
