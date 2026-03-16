<script setup lang="ts">
import { useAppConfig } from '~/composables/use-app-config';
import { useStagingBranding } from '~/composables/use-staging-branding';

defineOptions({
  inheritAttrs: false,
});

const { text = false, size } = defineProps<{
  text?: boolean;
  size?: string | number;
}>();

const { isStaging } = useStagingBranding();
const { contentBranch: branch } = useAppConfig();
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
