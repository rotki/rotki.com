<template>
  <div :class="$style.description">
    <slot />
  </div>
</template>

<style lang="scss" module>
.description {
  @apply text-body-1 text-rui-text-secondary;
}
</style>
