<script setup lang="ts">
const { loading = false } = defineProps<{
  label?: string;
  value?: number | string | boolean;
  loading?: boolean;
}>();
</script>

<template>
  <div
    class="px-2 xl:px-3 py-1 flex gap-2 items-center text-sm"
    :class="{ '!justify-start': label }"
  >
    <template v-if="loading">
      <div
        v-if="label !== undefined"
        class="font-medium flex-1 text-start"
      >
        <RuiSkeletonLoader class="w-36 h-6" />
      </div>
      <RuiSkeletonLoader class="w-24 h-6" />
    </template>
    <template v-else>
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
    </template>
  </div>
</template>
