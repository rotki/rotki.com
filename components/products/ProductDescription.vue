<template>
  <div
    :class="{
      [$style.container]: true,
      [$style.reverse]: $slots.right,
    }"
  >
    <div v-if="$slots.left" :class="$style.left">
      <slot name="left" />
    </div>
    <div
      :class="{
        [$style.text]: true,
        [$style.ps]: $slots.right,
      }"
    >
      <div :class="$style.title">
        <slot name="title" />
      </div>
      <div :class="$style.description">
        <slot />
      </div>
    </div>
    <div v-if="$slots.right" :class="$style.right">
      <slot name="right" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ProductDescription',
})
</script>

<style module lang="scss">
.container {
  @apply flex flex-col lg:h-52 items-center lg:mb-20 my-12 lg:mt-0 justify-between lg:flex-row;

  &.reverse {
    @apply flex-col-reverse lg:flex-row;
  }
}

.text {
  @apply flex flex-col;

  max-width: 40rem;
}

.left {
  @apply mr-8;
}

.left,
.right {
  img {
    @apply max-w-xs;
  }
}

.ps {
  @apply lg:pl-32 pl-0;
}

.title {
  @apply font-serif text-3xl text-typography font-medium mt-4 md:mt-0;
}

.description {
  @apply font-sans text-typography text-base mt-4 text-justify;
}
</style>
