<script setup lang="ts">
import { RuiIcon } from '@rotki/ui-library/components';

defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <div class="flex gap-2 items-start text-sm">
    <RuiIcon
      class="text-rui-primary shrink-0 mt-0.5"
      name="lu-circle-check"
      size="16"
    />
    <span class="text-rui-text">
      <slot />
    </span>
  </div>
</template>
