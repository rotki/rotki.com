<template>
  <div :class="$style.overlay" @click="dismiss">
    <div :class="$style.content">
      <login-form />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'LoginModal',
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
.overlay {
  @apply w-screen h-screen overflow-y-hidden z-30 fixed top-0 right-0;

  background-color: #0000002e;
}

.content {
  @apply flex flex-row align-middle justify-center h-screen items-center;
}
</style>
