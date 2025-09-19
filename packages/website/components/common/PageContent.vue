<template>
  <div :class="$style.content">
    <slot />
  </div>
</template>

<style lang="scss" module>
.content {
  @apply flex-row flex flex-grow h-full w-full py-16;
}
</style>
