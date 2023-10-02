<script lang="ts" setup>
defineProps<{
  selected: boolean;
}>();
const css = useCssModule();
</script>

<template>
  <div :class="css.mark">
    <RuiBadge :model-value="selected" color="primary" icon="check-line" />
  </div>
</template>

<style lang="scss" module>
.mark {
  @apply flex flex-row justify-end relative w-full h-0;
}
</style>
