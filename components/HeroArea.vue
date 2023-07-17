<script setup lang="ts">
const emit = defineEmits<{ (e: 'download'): void }>();
const css = useCssModule();
const { t } = useI18n();
</script>

<template>
  <div :class="css.wrapper">
    <div :class="css.title">
      <div :class="css.column">
        <i18n-t keypath="home.hero.title" scope="global">
          <br />
        </i18n-t>
      </div>
    </div>
    <div :class="css.subtitle">
      <div :class="css.column">
        <div :class="css.row">
          <div :class="css.motto">
            {{ t('home.hero.motto') }}
          </div>
        </div>
      </div>
    </div>
    <div :class="css.buttons">
      <DownloadButton @click="emit('download')" />
      <ActionButton
        :class="css.premium"
        :text="t('actions.get_premium')"
        @click="navigateTo('/products')"
      />
    </div>
    <div :class="css.screenshot">
      <img alt="rotki screenshot" src="/img/screenshot.png" />
    </div>
    <div :class="css.description">
      <InfoBox>
        <template #title
          >{{ t('home.advantages.open_source.title') }}
        </template>
        <div>{{ t('home.advantages.open_source.description') }}</div>
      </InfoBox>
      <InfoBox>
        <template #title>{{ t('home.advantages.local_app.title') }}</template>
        <div>{{ t('home.advantages.local_app.description') }}</div>
      </InfoBox>
      <InfoBox>
        <template #title
          >{{ t('home.advantages.own_your_data.title') }}
        </template>
        <div>{{ t('home.advantages.own_your_data.description') }}</div>
      </InfoBox>
    </div>
    <UseApp @download="emit('download')" />
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

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
