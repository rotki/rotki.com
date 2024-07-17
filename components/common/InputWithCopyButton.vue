<script setup lang="ts">
defineProps<{
  disabled?: boolean;
  copyValue: string;
}>();
</script>

<template>
  <RuiTextField color="primary">
    <template
      v-if="$slots.prepend"
      #prepend
    >
      <slot name="prepend" />
    </template>
    <template #append>
      <CopyButton
        :disabled="disabled"
        :model-value="copyValue"
      />
    </template>
  </RuiTextField>
</template>
