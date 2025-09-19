<script lang="ts" setup>
defineProps<{
  selected: boolean;
}>();
</script>

<template>
  <div :class="$style.mark">
    <RuiBadge
      :model-value="selected"
      color="primary"
      icon="lu-check"
    />
  </div>
</template>

<style lang="scss" module>
.mark {
  @apply flex flex-row justify-end relative w-full h-0;
}
</style>
