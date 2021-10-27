<template>
  <div :class="$style.container">
    <div :class="$style.box" @click="dismiss">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'NotificationMessage',
  emits: ['dismiss'],
  setup(_, { emit }) {
    const dismiss = () => {
      emit('dismiss')
    }
    return {
      dismiss,
    }
  },
})
</script>

<style lang="scss" module>
.container {
  @apply fixed top-2 right-2 w-11/12 md:w-1/4;
}
.box {
  @apply bg-white rounded-lg border-gray-300 border p-3 shadow-md flex flex-row;
}
</style>
