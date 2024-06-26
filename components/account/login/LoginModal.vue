<script setup lang="ts">
const modelValue = defineModel<boolean>({ required: true });
</script>

<template>
  <RuiDialog
    v-model="modelValue"
    max-width="430"
  >
    <RuiCard class="p-4">
      <LoginForm
        modal
        @complete="modelValue = false"
      />
    </RuiCard>
  </RuiDialog>
</template>
