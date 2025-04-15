<template>
  <h4 :class="$style.title">
    <slot />
  </h4>
</template>

<style lang="scss" module>
.title {
  @apply font-bold text-h4 text-rui-text mb-3;
}
</style>
