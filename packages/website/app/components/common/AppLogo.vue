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
const branch = useRuntimeConfig().public.testing ? 'develop' : 'main';
</script>

<template>
  <RuiLogo
    :text="text"
    :branch="branch"
    :logo="isStaging ? undefined : 'website'"
    :src="isStaging ? '/staging/logo.svg' : undefined"
    :size="size"
    v-bind="$attrs"
  />
</template>
