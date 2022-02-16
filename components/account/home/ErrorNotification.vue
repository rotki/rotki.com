<template>
  <transition name="fade">
    <notification-message v-if="visible">
      <div :class="$style.icon">
        <error-icon />
      </div>
      <div :class="$style.errorText">
        <div :class="$style.errorTitle">
          <slot name="title" />
        </div>
        <div :class="$style.errorDescription">
          <slot name="description" />
        </div>
      </div>
    </notification-message>
  </transition>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ErrorNotification',
  props: {
    visible: { required: true, type: Boolean },
  },
})
</script>
<style lang="scss" module>
.icon {
  @apply flex items-center;
}

.errorText {
  @apply ml-2;
}

.errorTitle {
  @apply font-sans font-bold;
}

.errorDescription {
  @apply font-sans text-shade11;
}
</style>
