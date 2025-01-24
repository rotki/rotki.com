<script setup lang="ts">
import { RuiIcon } from '@rotki/ui-library';
</script>

<template>
  <li class="py-1 inline-flex w-full">
    <RuiIcon
      name="lu-chevron-right"
      class="mr-2 mt-1 text-rui-text-secondary min-w-[1.5rem]"
      size="16"
    />
    <span class="py-0.5">
      <slot />
    </span>
  </li>
</template>
