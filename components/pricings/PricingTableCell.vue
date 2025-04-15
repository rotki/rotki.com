<script setup lang="ts">
defineProps<{
  label?: string;
  value: true | false | string;
}>();
</script>

<template>
  <div
    class="px-4 py-2 flex gap-2 justify-center items-center text-center"
    :class="{ '!justify-start': label }"
  >
    <div
      v-if="label"
      class="font-medium flex-1 text-start"
    >
      {{ label }}
    </div>
    <template v-if="typeof value === 'string'">
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
        name="lu-minus"
        size="24"
        color="success"
      />
    </template>
  </div>
</template>
