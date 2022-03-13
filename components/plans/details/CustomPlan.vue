<template>
  <div>
    <div :class="$style.space">
      <img
        :class="$style.image"
        alt="rotki in Space"
        src="~/assets/img/space.svg"
      />
    </div>
    <div :class="$style.row">
      <div :class="$style.wrapper">
        <div :class="$style.row">
          <div :class="$style.column2">
            <div :class="$style.title">Want a custom tailored plan?</div>
            <div :class="$style.description">
              Get in touch with us to tailor the plan to your needs.
            </div>
            <div :class="$style.button">
              <action-button text="Get in touch now" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'CustomPlan',
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply container;

  margin-top: 247px;
  padding-bottom: 200px;

  @include for-size(phone-only) {
    margin-top: 47px;
    padding-bottom: 0;
  }
}

.title {
  @apply font-bold font-serif text-shade11;

  letter-spacing: -0.03em;

  @include text-size(52px, 67px);
}

.description {
  @apply font-sans text-primary2 flex flex-col;

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
