<template>
  <div
    :class="{
      [$style.btn]: true,
      [$style.disabled]: disabled,
    }"
    @click="click"
  >
    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'IconButton',
  props: {
    disabled: {
      required: false,
      default: false,
      type: Boolean,
    },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const { disabled } = toRefs(props)
    const click = () => {
      if (disabled.value) {
        return
      }

      emit('click')
    }
    return {
      click,
    }
  },
})
</script>

<style lang="scss" module>
.btn {
  padding: 2px;
}

.disabled {
  @apply text-gray-400;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  transform: scale(0);
  animation: ripple 600ms linear;
  background-color: rgba(255, 255, 255, 0.7);
}
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
</style>
