<template>
  <div :class="$style.wrapper">
    <span @mouseenter="on" @mouseleave="off">
      <slot name="activator" />
    </span>
    <div
      :class="{
        [$style.tooltip]: true,
        [$style.active]: visible,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Tooltip',
  setup() {
    const visible = ref(false)
    let timeout: any
    const on = () => {
      timeout = setTimeout(() => {
        visible.value = true
      }, 400)
    }

    const off = () => {
      visible.value = false
      if (timeout) {
        clearTimeout(timeout)
      }
    }
    return {
      visible,
      on,
      off,
    }
  },
})
</script>

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
