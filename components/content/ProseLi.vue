<script setup lang="ts">
import { RuiIcon } from '@rotki/ui-library';
</script>

<template>
  <li class="py-1 inline-flex w-full">
    <RuiIcon
      name="arrow-drop-right-line"
      class="mr-2 text-rui-text-secondary min-w-[1.5rem]"
      size="24"
    />
    <span class="py-0.5">
      <slot />
    </span>
  </li>
</template>
