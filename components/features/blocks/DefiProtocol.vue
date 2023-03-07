<script setup lang="ts">
withDefaults(
  defineProps<{
    image?: string;
  }>(),
  {
    image: '',
  }
);

const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <div :class="css.protocol">
      <div :class="css['title-wrapper']">
        <div v-if="image">
          <img :class="css.image" :src="image" alt="Supported DeFi protocol" />
        </div>
        <div :class="css.title">
          <slot name="name" />
        </div>
      </div>
      <div :class="css.description">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply flex flex-col;

  width: 320px;
  margin-top: 48px;

  @include for-size(phone-only) {
    width: 100%;
  }

  @include for-size(tablet-portait-up) {
    width: 50%;
  }

  @include for-size(desktop-up) {
    width: 33%;
  }
}

.protocol {
  height: 140px;
}

.image {
  width: 50px;
}

.title-wrapper {
  @apply flex flex-row align-middle;
}

.title {
  @apply font-serif font-bold text-shade11 flex-col flex self-center;

  margin-left: 18px;
  letter-spacing: -0.03em;

  @include text-size(24px, 31px);
}

.description {
  @apply font-sans text-primary2;

  margin-top: 27px;
  padding-right: 16px;
  @include text-size(20px, 32px);
}
</style>
