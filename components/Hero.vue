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
            rotki is an open source portfolio tracker, accounting and analytics
            tool that respects your privacy.
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.buttons">
      <download-button @click="$emit('download')" />
      <action-button
        :class="$style.premium"
        text="Get Premium"
        @click="navigateTo"
      />
    </div>
    <div :class="$style.screenshot">
      <img alt="rotki screenshot" src="~/assets/img/macbook.png" />
    </div>
    <div :class="$style.description">
      <info>
        <template #title> Open source </template>
        rotki's source code is available to inspect, modify and enhance.
      </info>
      <info>
        <template #title> Local app </template>
        rotki is a local application. And its basic version is also free.
      </info>
      <info>
        <template #title> Own your data </template>
        A local application allows you to own your data. You don’t need to give
        your financial history to a centralized third party.
      </info>
    </div>
    <use-app @download="$emit('download')" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Hero',
  methods: {
    navigateTo() {
      window.location.href = '/products'
    },
  },
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
  @include for-size(phone-only) {
    @include margin-x($mobile-margin);
  }
}

.subtitle {
  @apply flex flex-row justify-center font-sans font-light text-primary2;

  margin-top: 36px;

  @include text-size(32px, 42px);
  @include for-size(phone-only) {
    @include margin-x($mobile-margin);
  }
}

.motto {
  @apply flex-col;

  max-width: 770px;

  @include for-size(desktop-up) {
    max-width: 820px;
  }
}

.column {
  @apply flex-col col-auto text-center;
}

.row {
  @apply flex-row;
}

.buttons {
  @apply flex flex-row justify-center flex-wrap;

  margin-top: 64px;
  > * {
    margin-right: $mobile-margin;
    margin-left: $mobile-margin;

    @include for-size(phone-only) {
      margin-top: $mobile-margin;
      margin-bottom: $mobile-margin;
    }
  }

  @include for-size(phone-only) {
    @apply flex-wrap;
  }
}

.screenshot {
  @apply flex flex-row justify-center;

  margin-top: 124px;

  @include for-size(phone-only) {
    margin-top: 64px;
    padding-right: $mobile-margin;
    padding-left: $mobile-margin;
  }

  @include for-size(tablet-portrait-up) {
    padding-right: $mobile-margin;
    padding-left: $mobile-margin;
  }
}

.description {
  @apply flex flex-row justify-center flex-wrap;

  margin-top: 127px;

  > * {
    @include margin-x(73px);

    @include for-size(phone-only) {
      margin-top: 32px;

      @include margin-x($mobile-margin);
    }

    @include for-size(tablet-portrait-up) {
      margin: $mobile-margin;
    }

    @include for-size(desktop-up) {
      margin: 56px;
    }
  }

  @include for-size(phone-only) {
    @apply flex-wrap text-center;

    margin-top: 32px;
  }
}
</style>
