<script setup lang="ts">
defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{
  (e: 'update:modelValue', dismiss: boolean): void;
}>();

function dismiss() {
  emit('update:modelValue', false);
}
</script>

<template>
  <ModalDialog
    :model-value="modelValue"
    boxless
    @update:model-value="dismiss()"
  >
    <div class="bg-white p-8 shadow-5 rounded">
      <LoginForm
        modal
        @complete="dismiss()"
      />
    </div>
  </ModalDialog>
</template>
