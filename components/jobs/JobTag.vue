<script setup lang="ts">
import { get } from '@vueuse/core';
import type { RuiIcons } from '@rotki/ui-library';

const props = defineProps<{
  tag: string;
}>();

const { tag } = toRefs(props);

const icon = computed<RuiIcons | undefined>(() => {
  const value = get(tag);
  const map: Record<string, RuiIcons> = {
    'full-time': 'timer-2-line',
    'part-time': 'timer-2-line',
    'remote': 'user-location-line',
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
      />
    </template>
    {{ tag }}
  </RuiChip>
</template>
