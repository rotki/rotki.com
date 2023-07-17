<script setup lang="ts">
const emit = defineEmits<{ (e: 'download'): void }>();

const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <div :class="css.col">
      <img
        :class="css.image"
        alt="rotki accountant"
        src="/img/accountant.svg"
      />
    </div>
    <div :class="css.column2">
      <div :class="css.row">
        <div :class="css.text">
          <i18n-t keypath="home.use_app" scope="global">
            <br />
          </i18n-t>
        </div>
      </div>
      <DownloadButton :class="css.button" @click="emit('download')" />
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply flex flex-row justify-center align-middle mt-16 lg:mt-32;

  padding-right: $mobile-margin * 2;
  padding-left: $mobile-margin * 2;

  @include for-size(phone-only) {
    @apply flex-wrap;

    padding-right: calc($mobile-margin / 2);
    padding-left: calc($mobile-margin / 2);
  }
}

.row {
  @apply flex flex-row;
}

.col {
  @apply flex flex-col;

  @include for-size(phone-only) {
    padding-left: $mobile-margin;
    padding-right: $mobile-margin;
  }

  @include for-size(tablet-portrait-up) {
    padding-left: $mobile-margin;
    padding-right: $mobile-margin;
  }

  @include for-size(tablet-lanscape-up) {
    padding-left: 0;
    padding-right: 0;
  }
}

.column2 {
  @apply flex flex-col self-center;

  max-width: 650px;

  @include for-size(phone-only) {
    margin-left: 0;
    margin-top: 48px;
    padding-left: $mobile-margin;
    padding-right: $mobile-margin;
  }

  @include for-size(tablet-portrait-up) {
    padding-left: $mobile-margin;
    padding-right: $mobile-margin;
  }

  @include for-size(tablet-landscape-up) {
    padding-left: 0;
    padding-right: 0;
  }

  @include for-size(desktop-up) {
    margin-left: 200px;
  }
}

.text {
  @apply flex-col text-shade8 font-regular align-middle;

  @include text-size(32px, 50px);
}

.button {
  margin-top: 64px;

  @include for-size(phone-only) {
    @include margin-x(auto);
  }
}

.image {
  margin: 0;
}
</style>
