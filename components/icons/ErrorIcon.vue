<script setup lang="ts">
import { defaultIconSize } from '~/utils/icon-size';

const css = useCssModule();
</script>

<template>
  <svg :class="css.warning" :style="defaultIconSize()" viewBox="0 0 24 24">
    <path
      d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
      fill="currentColor"
    />
  </svg>
</template>

<style lang="scss" module>
.warning {
  color: red;
}
</style>
