<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import InfoTooltip from '~/components/common/InfoTooltip.vue';
import VisibilityIcon from '~/components/icons/VisibilityIcon.vue';

const modelValue = defineModel<boolean>({ default: false });

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    showTooltipText?: string;
    hideTooltipText?: string;
  }>(),
  {
    disabled: false,
    showTooltipText: 'Show',
    hideTooltipText: 'Hide',
  },
);

function toggle(): void {
  if (props.disabled)
    return;

  set(modelValue, !get(modelValue));
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
