<script setup lang="ts">
defineProps<{
  disabled?: boolean;
  copyValue: string;
}>();
</script>

<template>
  <RuiTextField color="primary">
    <template #append>
      <CopyButton
        :disabled="disabled"
        :model-value="copyValue"
      />
    </template>
  </RuiTextField>
</template>
