<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.container">
    <div
      v-if="$slots.left"
      :class="css.left"
    >
      <slot name="left" />
    </div>
    <div :class="css.text">
      <div :class="css.title">
        <slot name="title" />
      </div>
      <div :class="css.description">
        <slot />
      </div>
    </div>
  </div>
</template>

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
  @apply text-xl text-rui-text font-medium mt-4 lg:mt-0;
}

.description {
  @apply text-rui-text text-base mt-4 text-justify;
}
</style>
