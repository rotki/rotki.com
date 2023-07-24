<script setup lang="ts">
defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();
const css = useCssModule();
</script>

<template>
  <CustomCheckbox
    id="refund"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <span>
      I have read and agreed to the
      <NuxtLink :class="css.link" target="_blank" to="/refund-policy">
        Refunds/Cancellation Policy
      </NuxtLink>
    </span>
  </CustomCheckbox>
</template>

<style module lang="scss">
.link {
  @apply text-rui-primary-darker;
}
</style>
