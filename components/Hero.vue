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

$subtitle-font-size: 32px;
$subtitle-line-height: 42px;

.wrapper {
  margin-top: 83px;
}

.title {
  @apply flex flex-row justify-center font-serif text-primary2;

  @include text-size(66px, 84px);
}

.subtitle {
  @apply flex flex-row justify-center font-sans font-light text-primary2;

  margin-top: 36px;

  @include text-size(32px, 42px);
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
    margin-left: $mobile-margin;
    margin-top: $mobile-margin;
  }
}

.screenshot {
  @apply flex flex-row justify-center;

  margin-top: 124px;

  @include margins();
  @include for-size(phone-only) {
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
      margin-left: 16px;
      margin-right: 16px;
      margin-top: 32px;
    }

    @include for-size(tablet-portrait-up) {
      margin-left: 16px;
      margin-right: 16px;
    }
  }

  @include for-size(phone-only) {
    @apply flex-wrap text-center;

    margin-top: 32px;
  }
}
</style>
