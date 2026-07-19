<script setup lang="ts">
import { integrationQualifier, integrationSlug } from '~/utils/integration-slug';

defineProps<{
  item: { label: string; image: string };
}>();
</script>

<template>
  <NuxtLink
    :to="`/integrations/${integrationSlug(item.label)}`"
    class="flex flex-col items-center gap-1.5 w-[4.5rem] hover:opacity-80 transition-opacity"
  >
    <div class="w-14 h-14 border border-rui-grey-300 rounded p-2.5">
      <img
        class="w-full h-full object-contain"
        :src="item.image"
        :alt="item.label"
        width="36"
        height="36"
        loading="lazy"
      />
    </div>
    <span class="text-xs text-rui-text-secondary text-center leading-tight line-clamp-2">
      {{ item.label }}
    </span>
    <span
      v-if="integrationQualifier(item.label)"
      class="text-[0.625rem] text-rui-text-disabled text-center leading-tight"
    >
      {{ integrationQualifier(item.label) }}
    </span>
  </NuxtLink>
</template>
