<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div>
    <div :class="$style.space">
      <img
        :class="$style.image"
        alt="rotki in Space"
        src="/img/space.svg"
      />
    </div>
    <div :class="$style.row">
      <div
        :class="$style.wrapper"
        class="container"
      >
        <div :class="$style.row">
          <div :class="$style.column2">
            <div :class="$style.title">
              {{ t('home.plans.details.custom.title') }}
            </div>
            <div :class="$style.description">
              {{ t('home.plans.details.custom.subtitle') }}
            </div>
            <div :class="$style.button">
              <RuiButton
                variant="outlined"
                size="lg"
                class="!py-4 !px-10 !text-xl uppercase outline-2"
                rounded
                color="primary"
              >
                {{ t('actions.get_in_touch') }}
              </RuiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
@use '@/assets/css/main';
@use '@/assets/css/media';

.wrapper {
  margin-top: 247px;
  padding-bottom: 200px;

  @include for-size(phone-only) {
    margin-top: 47px;
    padding-bottom: 0;
  }
}

.title {
  @apply font-bold text-rui-grey-800;

  letter-spacing: -0.03em;

  @include text-size(52px, 67px);
}

.description {
  @apply text-rui-text flex flex-col;

  margin-top: 22px;

  @include text-size(24px, 32px);
}

.button {
  margin-top: 48px;

  @include for-size(phone-only) {
    margin-right: auto;
    margin-left: auto;
  }
}

.row {
  @apply flex flex-row align-middle flex-wrap;
}

.space {
  position: relative;

  @include for-size(phone-only) {
    padding-top: 24px;
  }
}

.column2 {
  @apply flex flex-col self-center;

  width: 100%;

  @include for-size(phone-only) {
    @include margin-x($mobile-margin);
  }

  @include for-size(tablet-portrait-up) {
    @include margin-x($mobile-margin);
  }

  @include for-size(tablet-landscape-up) {
    margin-left: 400px;
  }
}

.image {
  @include for-size(phone-only) {
    position: relative;
    width: 100%;
    padding: $mobile-margin;
  }

  @include for-size(tablet-portrait-up) {
    margin-top: 48px;
  }

  @include for-size(tablet-landscape-up) {
    top: 60px;
    left: -250px;
    position: absolute;
  }
}
</style>
