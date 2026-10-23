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
  hideDetails = true,
} = defineProps<{
  copyValue: string;
  disabled?: boolean;
  label?: string;
  color?: ContextColorsType;
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
