<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.column">
    <div :class="css.link">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" module>
@import '~/assets/css/media';
.column {
  @apply flex flex-col font-sans uppercase justify-center text-primary2;

  margin-left: 16px;
  margin-right: 16px;

  @include for-size(phone-only) {
    width: 100%;
    margin: 0 auto;
  }
}

.link {
  @apply hover:text-shade8;
}
</style>
