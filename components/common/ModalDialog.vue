<template>
  <transition name="fade">
    <div :class="$style.overlay" @click="dismiss">
      <div :class="$style.wrapper">
        <div
          :class="$style.dialog"
          :style="style"
          @click="($event) => $event.stopPropagation()"
        >
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { computed, defineComponent, toRefs } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ModalDialog',
  props: {
    width: {
      type: String,
      required: false,
      default: '800px',
    },
    height: {
      type: String,
      required: false,
      default: '539px',
    },
    padding: {
      type: String,
      required: false,
      default: '0px',
    },
  },
  emits: ['dismiss'],
  setup(props, { emit }) {
    const { width, height, padding } = toRefs(props)
    const dismiss = () => {
      emit('dismiss')
    }

    const style = computed(() => ({
      width: width.value,
      height: height.value,
      padding: padding.value,
    }))
    return {
      style,
      dismiss,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.overlay {
  @apply w-screen h-screen overflow-y-hidden bg-opacity-50 bg-black z-30 fixed top-0 right-0;
}

.wrapper {
  @apply flex flex-row align-middle justify-center h-screen items-center;
}

.dialog {
  @apply bg-white flex flex-col rounded-lg mb-2;
}
</style>
