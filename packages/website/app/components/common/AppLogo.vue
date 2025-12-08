<script setup lang="ts">
import { useStagingBranding } from '~/composables/use-staging-branding';

defineOptions({
  inheritAttrs: false,
});

const props = withDefaults(defineProps<{
  text?: boolean;
  size?: string | number;
}>(), {
  text: false,
  size: undefined,
});

/**
 * Converts size prop to pixel value for image dimensions
 * Default size is 3rem = 48px (assuming 16px base)
 */
function getSizeInPixels(): number {
  const sizeValue = props.size;
  if (!sizeValue)
    return 48; // 3rem default

  if (typeof sizeValue === 'number')
    return sizeValue * 16; // Assume rem, convert to px

  // Parse string value
  const num = Number.parseFloat(sizeValue);
  if (sizeValue.includes('rem'))
    return num * 16;
  if (sizeValue.includes('px'))
    return num;
  return num * 16; // Default to rem conversion
}

const { isStaging } = useStagingBranding();
const branch = useRuntimeConfig().public.testing ? 'develop' : 'main';
const name = 'rotki';
</script>

<template>
  <!-- Staging logo: SSR-safe, renders on both server and client -->
  <div
    v-if="isStaging"
    class="gap-x-4 flex items-center relative"
  >
    <img
      src="/staging/logo.svg"
      alt="rotki staging"
      :width="getSizeInPixels()"
      :height="getSizeInPixels()"
      :style="{ width: `${getSizeInPixels()}px`, height: `${getSizeInPixels()}px` }"
      v-bind="$attrs"
    />
    <div
      v-if="text"
      class="text-h4 text-rui-primary dark:text-white"
    >
      {{ name }}
    </div>
  </div>
  <!-- Production logo: uses ClientOnly due to RuiLogo hydration requirements -->
  <ClientOnly v-else>
    <RuiLogo
      :text="text"
      :branch="branch"
      logo="website"
      :size="size"
      v-bind="$attrs"
    />
    <template #fallback>
      <RuiLogo
        class="opacity-0 invisible transition delay-1000"
        :text="text"
        :size="size"
        v-bind="$attrs"
      />
    </template>
  </ClientOnly>
</template>
