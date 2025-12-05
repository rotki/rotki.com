<script setup lang="ts">
import { get } from '@vueuse/core';

const modelValue = defineModel<boolean>({ required: true });

withDefaults(
  defineProps<{
    id?: string;
  }>(),
  {
    id: '',
  },
);
</script>

<template>
  <div :class="$style.checkbox">
    <input
      :id="id"
      :checked="modelValue"
      type="checkbox"
      @click="modelValue = !get(modelValue)"
    />
    <label
      :class="$style.label"
      :for="id"
    >
      <slot />
    </label>
  </div>
</template>

<style lang="scss" module>
.checkbox {
  @apply flex flex-row items-center;

  font-size: 15px;
  line-height: 18px;
  margin-top: 16px;

  input {
    @apply text-rui-primary-darker;
  }
}

.label {
  @apply ml-4;
}
</style>
