<script setup lang="ts">
defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{
  (e: 'update:modelValue', dismiss: boolean): void;
}>();

const dismiss = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <ModalDialog :model-value="modelValue" boxless @update:model-value="dismiss">
    <LoginForm modal @complete="dismiss" />
  </ModalDialog>
</template>
