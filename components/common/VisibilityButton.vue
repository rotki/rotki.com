<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    disabled?: boolean;
    showTooltipText?: string;
    hideTooltipText?: string;
  }>(),
  {
    disabled: false,
    modelValue: false,
    showTooltipText: 'Show',
    hideTooltipText: 'Hide',
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

function toggle() {
  if (props.disabled)
    return;

  emit('update:modelValue', !props.modelValue);
}
</script>

<template>
  <InfoTooltip :class="$style.tooltip">
    <template #activator>
      <button
        :class="$style.button"
        :disabled="disabled"
        @click="toggle()"
      >
        <VisibilityIcon :visible="modelValue" />
      </button>
    </template>

    <span v-if="modelValue"> {{ hideTooltipText }} </span>
    <span v-else> {{ showTooltipText }} </span>
  </InfoTooltip>
</template>

<style lang="scss" module>
.tooltip {
  @apply m-2;
}

.button {
  @apply focus:outline-none flex items-center justify-center;
  @apply w-10 h-10 rounded-full hover:bg-rui-grey-100 transition disabled:text-gray-400 disabled:cursor-not-allowed;
}
</style>
