<script setup lang="ts">
import { get } from '@vueuse/core';

const props = defineProps<{
  tag: string;
}>();

const { tag } = toRefs(props);

const icon: ComputedRef<string> = computed(() => {
  const value = get(tag);
  return (
    {
      'full-time': 'timer-2-line',
      'part-time': 'timer-2-line',
      'remote': 'user-location-line',
    }[value] ?? ''
  );
});
</script>

<template>
  <RuiChip
    class="capitalize hover:!bg-transparent py-1 !min-h-0"
    :label="tag"
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
  </RuiChip>
</template>
