<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div>
    <div :class="css.wrapper">
      <div :class="css.title">
        <slot name="title" />
      </div>
    </div>
    <div :class="css.bottom">
      <div :class="css.subtitle">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply flex flex-row justify-center;
}

.title {
  @apply flex-col font-serif text-primary2 text-4xl font-bold;

  letter-spacing: -0.01em;

  @include text-size(32px, 47px);
}

.subtitle {
  @apply flex-col font-sans text-primary2 text-center;

  @include text-size(24px, 30px);
}

.bottom {
  @apply flex flex-row justify-center;

  margin-top: 25px;
  max-width: 350px;
}
</style>
