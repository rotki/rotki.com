<template>
  <div :class="$style.body">
    <p :class="$style.header">
      <slot name="header" />
    </p>
    <slot />
  </div>
</template>

<style module lang="scss">
.body {
  @apply text-rui-grey-800 text-xl;
}

.header {
  @apply font-bold text-rui-grey-800 pb-2 text-2xl mb-4;
}
</style>
