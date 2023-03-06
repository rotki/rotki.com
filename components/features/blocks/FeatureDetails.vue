<template>
  <div :class="css.wrapper">
    <div :class="css.column">
      <div v-if="slots.subtitle" :class="css.subtitle">
        <slot name="subtitle" />
      </div>
      <div :class="css.description">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const css = useCssModule()
const slots = useSlots()
</script>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply flex flex-row;

  margin-bottom: 40px;
}

.column {
  @apply flex flex-col;
}

.subtitle {
  @apply flex flex-row font-serif font-bold text-primary2;

  letter-spacing: -0.01em;
  margin-top: 58px;
  margin-bottom: 16px;

  @include text-size(25px, 46px);
}

.description {
  @apply flex flex-row font-sans text-primary2;

  @include text-size(24px, 32px);
}
</style>
