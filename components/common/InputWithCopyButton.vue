<script setup lang="ts">
import type { TextFieldProps } from '@rotki/ui-library/components';

type Props = TextFieldProps & {
  copyValue: string;
};

defineOptions({
  inheritAttrs: false,
});

const modelValue = defineModel<string>({ required: true });

const props = defineProps<Props>();
</script>

<template>
  <RuiTextField
    v-bind="props"
    v-model="modelValue"
    color="primary"
    variant="outlined"
    hide-details
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
