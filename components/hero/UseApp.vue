<template>
  <div :class="$style.wrapper">
    <div :class="$style.col">
      <img src="~/assets/img/accountant.svg" :class="$style.image" />
    </div>
    <div :class="$style.column2">
      <div :class="$style.row">
        <div :class="$style.text">
          Rotki offers tracking of all your crypto assets no matter where they
          are. Either on a blockchain or on one of the supported exchanges.
        </div>
      </div>
      <download-button :class="$style.button" @click="$emit('download')" />
    </div>
  </div>
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  name: 'UseApp',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-row justify-center align-middle;

  margin-top: 129px;

  @include for-size(phone-only) {
    @apply flex-wrap;

    margin-left: $mobile-margin;
    margin-right: $mobile-margin;
  }
}

.row {
  @apply flex flex-row;
}

.col {
  @apply flex flex-col;
}

.column2 {
  @apply flex flex-col self-center;

  margin-left: 200px;
  max-width: 650px;

  @include for-size(phone-only) {
    margin-left: 0;
    margin-top: 48px;
  }
}

$text-font-size: 32px;
$text-line-height: 50px;

.text {
  @apply flex-col text-shade8 font-regular align-middle;

  font-size: $text-font-size;
  line-height: $text-line-height;

  @include for-size(phone-only) {
    font-size: $text-font-size * $mobile-font-percentage;
    line-height: $text-line-height * $mobile-font-percentage;
  }
}

.button {
  margin-top: 64px;
}

.image {
  margin: 0;
}
</style>
