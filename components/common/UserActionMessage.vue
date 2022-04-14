<template>
  <div :class="$style.body">
    <p :class="$style.header">
      <slot name="header" />
    </p>
    <slot />
  </div>
</template>

<script>
export default {
  name: 'UserActionMessage',
}
</script>

<style module lang="scss">
.body {
  @apply font-sans text-shade11 text-xl;
}

.header {
  @apply font-serif font-bold text-shade11 pb-2 text-2xl mb-4;
}
</style>
