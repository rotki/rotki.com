<template>
  <div :class="$style.container">
    <div v-if="$slots.left" :class="$style.left">
      <slot name="left" />
    </div>
    <div :class="$style.text">
      <div :class="$style.title">
        <slot name="title" />
      </div>
      <div :class="$style.description">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ProductDescription',
})
</script>

<style lang="scss" module>
.container {
  @apply flex flex-col items-center mb-20 lg:mt-0 justify-between lg:flex-row space-x-0 md:space-x-8 max-w-full;
}

.text {
  @apply flex flex-col lg:w-2/5;
}

.left {
  @apply lg:w-3/5;
  img {
    @apply max-w-full shadow-sm rounded;
  }
}

.title {
  @apply font-serif text-xl text-typography font-medium mt-4 lg:mt-0;
}

.description {
  @apply font-sans text-typography text-base mt-4 text-justify;
}
</style>
