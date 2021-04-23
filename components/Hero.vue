<template>
  <div :class="$style.wrapper">
    <div :class="$style.title">
      <div :class="$style.column">
        <div :class="$style.row">Portfolio manager that</div>
        <div :class="$style.row">respects your privacy</div>
      </div>
    </div>
    <div :class="$style.subtitle">
      <div :class="$style.column">
        <div :class="$style.row">
          <div :class="$style.motto">
            Rotki is an open source portfolio tracker, accounting and analytics
            tool that respects your privacy.
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.buttons">
      <download-button @click="$emit('download')" />
      <action-button :class="$style.premium" text="Get Premium" />
    </div>
    <div :class="$style.screenshot">
      <img src="~/assets/img/macbook.png" />
    </div>
    <div :class="$style.description">
      <info>
        <template #title> Open source </template>
        Rotki is a local application. And its basic version is free.
      </info>
      <info>
        <template #title> Local app </template>
        Rotki is a local application. And its basic version is also free.
      </info>
      <info>
        <template #title> Own your data </template>
        A local application allows you to own your data. You don’t need to give
        your financial history to a centralized third party.
      </info>
    </div>
    <use-app />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Hero',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

$title-font-size: 66px;
$title-line-height: 84px;

$subtitle-font-size: 32px;
$subtitle-line-height: 42px;

.wrapper {
  margin-top: 83px;
}

.title {
  @apply flex flex-row justify-center font-serif text-primary2;

  font-size: $title-font-size;
  line-height: $title-line-height;

  @include for-size(phone-only) {
    font-size: $title-font-size * $mobile-font-percentage;
    line-height: $title-line-height * $mobile-font-percentage;
  }
}

.subtitle {
  @apply flex flex-row justify-center font-sans font-light text-primary2;

  font-size: $subtitle-font-size;
  line-height: $subtitle-line-height;
  margin-top: 36px;

  @include for-size(phone-only) {
    font-size: $subtitle-font-size * $mobile-font-percentage;
    line-height: $subtitle-line-height * $mobile-font-percentage;
  }
}

.motto {
  @apply flex-col;

  max-width: 770px;
}

.column {
  @apply flex-col col-auto text-center;
}

.row {
  @apply flex-row;
}

.buttons {
  @apply flex flex-row justify-center;

  margin-top: 64px;

  @include for-size(phone-only) {
    @apply flex-wrap;
  }
}

.premium {
  margin-left: 32px;

  @include for-size(phone-only) {
    margin-left: 16px;
  }
}

.screenshot {
  @apply flex flex-row justify-center;

  margin-top: 124px;

  @include for-size(phone-only) {
    margin-left: $mobile_margin;
    margin-right: $mobile_margin;
    margin-top: 64px;
  }
}

.description {
  @apply flex flex-row justify-center;

  margin-top: 127px;

  > * {
    margin-left: 73px;
    margin-right: 73px;

    @include for-size(phone-only) {
      margin-left: $mobile_margin;
      margin-right: $mobile_margin;
      margin-top: 32px;
    }
  }

  @include for-size(phone-only) {
    @apply flex-wrap text-center;

    margin-top: 32px;
  }
}
</style>
