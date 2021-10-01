<template>
  <div>
    <span @mouseenter="on" @mouseleave="off">
      <slot name="activator" />
    </span>
    <div v-show="visible" :class="$style.tooltip">
      <div>
        <div :class="$style.content">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { ref } from '@nuxtjs/composition-api'

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
.tooltip {
  @apply bg-white border-0 mb-3 block z-50 font-normal leading-normal text-sm max-w-xs text-left no-underline break-words rounded-lg absolute -mt-20 shadow;
}
.content {
  @apply bg-shade1 text-shade11 opacity-75 p-3 mb-0 border border-solid rounded;
}
</style>
