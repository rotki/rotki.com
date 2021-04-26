<template>
  <div :class="$style.row">
    <div :class="$style.column">
      <a href="#features" :class="$style.link"> Features </a>
    </div>
    <div :class="$style.column">
      <a
        href="https://rotki.readthedocs.io/en/latest/index.html"
        target="_blank"
        :class="$style.link"
      >
        Documentation
      </a>
    </div>
    <div :class="$style.column">
      <a href="https://blog.rotki.com/" target="_blank" :class="$style.link">
        Blog
      </a>
    </div>
    <div :class="$style.column">
      <a href="mailto:info@rotki.com" target="_blank" :class="$style.link">
        Contact
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Links',
})
</script>

<style module lang="scss">
@import '~assets/css/media.scss';

.row {
  @apply flex flex-row justify-around;

  max-width: 453px;

  @include for-size(phone-only) {
    @apply flex-wrap justify-center;

    max-width: 100%;
  }
}

.column {
  @apply flex flex-col font-sans uppercase justify-center text-primary2;

  margin-left: 16px;
  margin-right: 16px;

  @include for-size(phone-only) {
    width: 100%;
    margin: 0 auto;
  }
}

.link {
  @apply hover:text-shade8;
}
</style>
