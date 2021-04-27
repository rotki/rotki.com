<template>
  <div :class="$style.row">
    <div :class="$style.column1">
      <img :class="$style.image" src="~/assets/img/space.svg" />
    </div>
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
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'CustomPlan',
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.wrapper {
  @apply container mx-auto;

  margin-top: 247px;
  padding-bottom: 400px;

  @include for-size(phone-only) {
    margin-top: 47px;
    padding-bottom: 100px;
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
}

.row {
  @apply flex flex-row align-middle flex-wrap;
}

.column1 {
  position: relative;
}

.column2 {
  @apply flex flex-col col-span-12 md:col-span-7  self-center;

  margin-left: 400px;

  @include for-size(phone-only) {
    margin-left: 0;
  }
}

$image-width: 625px;
$image-height: 603px;

.image {
  position: absolute;
  left: -233px;
  top: -150px;
  width: $image-width;
  height: $image-height;

  @include for-size(phone-only) {
    position: relative;
    left: 0;
    top: 0;
    width: $image-width * 0.9;
    height: $image-height * 0.9;
  }
}
</style>
