<script setup lang="ts">
import type { ContextColorsType } from '@rotki/ui-library';
import CopyButton from '~/components/common/CopyButton.vue';

defineOptions({
  inheritAttrs: false,
});

const modelValue = defineModel<string>({ required: true });

const {
  copyValue,
  disabled,
  color = 'primary',
  variant = 'outlined',
  hideDetails = true,
} = defineProps<{
  copyValue: string;
  disabled?: boolean;
  label?: string;
  color?: ContextColorsType;
  variant?: 'default' | 'filled' | 'outlined';
  dense?: boolean;
  readonly?: boolean;
  hideDetails?: boolean;
}>();

defineSlots<{
  prepend: () => void;
}>();
</script>

<template>
  <RuiTextField
    v-bind="$attrs"
    v-model="modelValue"
    :label="label"
    :color="color"
    :variant="variant"
    :hide-details="hideDetails"
    :disabled="disabled"
    :dense="dense"
    :readonly="readonly"
  >
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
