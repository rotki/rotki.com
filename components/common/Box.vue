<template>
  <div :class="$style.box">
    <div v-if="$slots.label" :class="$style.label">
      <slot name="label" />
    </div>

    <slot />
  </div>
</template>

<script>
export default {
  name: 'Box',
}
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.box {
  @apply border p-8 rounded-xl bg-white;

  box-shadow: 0 2px 12px rgba(74, 91, 120, 0.1) !important;
  width: 550px;

  @include for-size(phone-only) {
    @apply p-6;

    width: 100%;
  }
}

.label {
  @apply text-shade11 font-serif mb-8;

  @include text-size(24px, 32px);
}
</style>
