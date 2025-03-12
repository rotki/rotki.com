<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import { get } from '@vueuse/core';

const props = defineProps<{
  tag: string;
}>();

const { tag } = toRefs(props);

const icon = computed<RuiIcons | undefined>(() => {
  const value = get(tag);
  const map: Record<string, RuiIcons> = {
    'full-time': 'lu-timer',
    'part-time': 'lu-timer',
    'remote': 'lu-map-pin',
  };

  return map[value] ?? undefined;
});
</script>

<template>
  <RuiChip
    class="capitalize hover:!bg-transparent py-1 !min-h-0"
    variant="outlined"
  >
    <template
      v-if="icon"
      #prepend
    >
      <RuiIcon
        :name="icon"
        class="p-0.5"
        size="20"
      />
    </template>
    {{ tag }}
  </RuiChip>
</template>
