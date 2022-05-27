<template>
  <div :class="$style.wrapper">
    <div :class="$style.title">
      <div :class="$style.column">
        <i18n path="home.hero.title">
          <br />
        </i18n>
      </div>
    </div>
    <div :class="$style.subtitle">
      <div :class="$style.column">
        <div :class="$style.row">
          <div :class="$style.motto">
            {{ $t('home.hero.motto') }}
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.buttons">
      <download-button @click="$emit('download')" />
      <action-button
        :class="$style.premium"
        :text="$tc('actions.get_premium')"
        @click="navigateTo"
      />
    </div>
    <div :class="$style.screenshot">
      <img alt="rotki screenshot" src="~/assets/img/screenshot.png" />
    </div>
    <div :class="$style.description">
      <info>
        <template #title
          >{{ $t('home.advantages.open_source.title') }}
        </template>
        <div>{{ $t('home.advantages.open_source.description') }}</div>
      </info>
      <info>
        <template #title>{{ $t('home.advantages.local_app.title') }}</template>
        <div>{{ $t('home.advantages.local_app.description') }}</div>
      </info>
      <info>
        <template #title
          >{{ $t('home.advantages.own_your_data.title') }}
        </template>
        <div>{{ $t('home.advantages.own_your_data.description') }}</div>
      </info>
    </div>
    <use-app @download="$emit('download')" />
  </div>
</template>

<script lang="ts">
import { defineComponent, useRouter } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Hero',
  setup() {
    const router = useRouter()
    const navigateTo = () => {
      router.push('/products')
    }
    return {
      navigateTo,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

$subtitle-font-size: 32px;
$subtitle-line-height: 42px;

.wrapper {
  margin-top: 83px;
}

.title {
  @apply flex flex-row justify-center font-serif text-primary2 font-bold;

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
  @apply flex flex-row justify-center flex-wrap mt-16 lg:mt-32;

  > * {
    @apply p-8;
  }
}
</style>
