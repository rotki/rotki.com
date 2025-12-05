<script lang="ts" setup>
defineProps<{ selected: boolean }>();

const emit = defineEmits<{ click: [] }>();
</script>

<template>
  <div
    :class="[$style.content, { [$style.selected]: selected }]"
    @click="emit('click')"
  >
    <div :class="$style.icon">
      <slot />
    </div>
    <div :class="$style.text">
      <slot name="label" />
    </div>
    <RuiRadio
      :model-value="selected ? 'checked' : undefined"
      color="primary"
      hide-details
      value="checked"
    />
  </div>
</template>

<style lang="scss" module>
.content {
  @apply flex gap-4 justify-center items-center cursor-pointer p-4;
  @apply min-w-[16rem] xl:min-w-[20rem] 2xl:min-w-[26rem] w-full;
  @apply bg-white hover:bg-rui-primary/[0.01] border-black/[0.12] border border-solid rounded-lg;

  &.selected {
    @apply border-rui-primary bg-rui-primary/[.1];
  }
}

.icon {
  @apply w-10 h-10;
}

.text {
  @apply font-bold grow;
}
</style>
