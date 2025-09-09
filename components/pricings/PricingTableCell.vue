<script setup lang="ts">
defineProps<{
  label?: string;
  value?: number | string | boolean;
}>();
</script>

<template>
  <div
    class="px-4 xl:px-6 py-2 flex gap-2 items-center text-sm"
    :class="{ '!justify-start': label }"
  >
    <div
      v-if="label"
      class="font-medium flex-1 text-start"
    >
      {{ label }}
    </div>
    <template v-if="value === ''">
      &nbsp;
    </template>
    <template v-else-if="typeof value === 'string' || typeof value === 'number'">
      {{ value }}
    </template>
    <template v-else-if="value">
      <RuiIcon
        name="lu-circle-check"
        size="24"
        color="success"
      />
    </template>
    <template v-else>
      <RuiIcon
        class="text-rui-text-secondary"
        name="lu-minus"
        size="24"
      />
    </template>
  </div>
</template>
