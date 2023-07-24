<script setup lang="ts">
const css = useCssModule();
const slots = useSlots();
</script>

<template>
  <div
    :class="{
      [css.container]: true,
      [css.reverse]: slots.right,
    }"
  >
    <div v-if="slots.left" :class="css.left">
      <slot name="left" />
    </div>
    <div
      :class="{
        [css.text]: true,
        [css.ps]: slots.right,
      }"
    >
      <div :class="css.title">
        <slot name="title" />
      </div>
      <div :class="css.description">
        <slot />
      </div>
    </div>
    <div v-if="slots.right" :class="css.right">
      <slot name="right" />
    </div>
  </div>
</template>

<style module lang="scss">
.container {
  @apply flex flex-col items-center lg:mb-20 my-12 lg:mt-0 justify-between lg:flex-row space-x-0 md:space-x-8 max-w-full;

  &.reverse {
    @apply flex-col-reverse lg:flex-row;
  }
}

.text {
  @apply flex flex-col;

  max-width: 40rem;
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
  @apply text-3xl text-rui-text font-medium mt-4 lg:mt-0;
}

.description {
  @apply text-rui-text text-base mt-4 text-justify;
}
</style>
