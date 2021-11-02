<template>
  <div v-if="visible" :class="{ [$style.container]: true, [$style.out]: out }">
    <div :class="$style.overlay" @click="dismiss">
      <div :class="$style.wrapper">
        <div
          :class="{
            [$style.dialog]: true,
            [$style.boxless]: boxless,
          }"
          :style="style"
          @click="($event) => $event.stopPropagation()"
        >
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  onMounted,
  ref,
  toRefs,
  watch,
} from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ModalDialog',
  props: {
    value: {
      type: Boolean,
      required: true,
    },
    width: {
      type: String,
      required: false,
      default: '800px',
    },
    height: {
      type: String,
      required: false,
      default: undefined,
    },
    padding: {
      type: String,
      required: false,
      default: '0px',
    },
    boxless: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  emits: ['input'],
  setup(props, { emit }) {
    const { width, height, padding, value } = toRefs(props)
    const out = ref(false)
    const visible = ref(false)

    onMounted(() => (visible.value = value.value))
    watch(value, (display) => {
      if (display) {
        out.value = false
        visible.value = true
      } else {
        out.value = true
        nextTick(() => {
          setTimeout(() => {
            visible.value = false
          }, 800)
        })
      }
    })
    const dismiss = () => {
      emit('input', false)
    }

    const style = computed(() => ({
      'max-width': width.value,
      height: height.value,
      padding: padding.value,
      margin: '0.5rem',
    }))
    return {
      out,
      style,
      visible,
      dismiss,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.overlay {
  @apply w-screen h-screen overflow-y-hidden z-30 fixed top-0 right-0;

  background-color: #0000002e;
}

.wrapper {
  @apply flex flex-row align-middle justify-center h-screen items-center;
}

.dialog {
  &:not(.boxless) {
    @apply bg-white flex flex-col rounded-lg mb-2;
  }

  transform: scale(0);
  animation: zoomIn 0.5s 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

.out .dialog {
  animation: zoomOut 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

.container {
  @apply w-screen h-screen overflow-y-hidden z-30 fixed top-0 right-0;

  transform: scaleY(0.01) scaleX(0);
  animation: unfoldIn 1s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

.out.container {
  transform: scale(1);
  animation: unfoldOut 1s 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

@keyframes unfoldIn {
  0% {
    transform: scaleY(0.005) scaleX(0);
  }
  50% {
    transform: scaleY(0.005) scaleX(1);
  }
  100% {
    transform: scaleY(1) scaleX(1);
  }
}

@keyframes unfoldOut {
  0% {
    transform: scaleY(1) scaleX(1);
  }
  50% {
    transform: scaleY(0.005) scaleX(1);
  }
  100% {
    transform: scaleY(0.005) scaleX(0);
  }
}

@keyframes zoomIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes zoomOut {
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}
</style>
