<script setup lang="ts">
import { get, set } from '@vueuse/core';

const props = withDefaults(defineProps<{ disabled?: boolean }>(), {
  disabled: false,
});
const disabled = toRef(props, 'disabled');

const visible = ref(false);

const { start, stop } = useTimeoutFn(
  () => {
    set(visible, true);
  },
  400,
  { immediate: false },
);

const on = () => {
  if (get(disabled)) {
    return;
  }
  start();
};

const off = () => {
  set(visible, false);
  stop();
};

const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <span @mouseenter="on()" @mouseleave="off()">
      <slot name="activator" />
    </span>
    <div
      :class="{
        [css.tooltip]: true,
        [css.active]: visible,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply relative inline-block;
}

.tooltip {
  @apply block z-50 font-normal leading-normal text-sm w-max max-w-xs text-left no-underline rounded-lg absolute bg-white shadow-md p-3 left-1/2 transform -translate-x-1/2 bottom-full mb-4 invisible opacity-0 transition-all;

  &::after {
    content: '';
    border-color: white transparent transparent transparent;

    @apply absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-solid;
  }

  &.active {
    @apply visible opacity-100;
  }
}
</style>
