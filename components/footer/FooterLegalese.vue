<template>
  <div :class="$style.links">
    <external-link same-tab url="/impressum" text="Impressum" />
    <external-link same-tab url="/privacy-policy" text="Privacy Policy" />
    <external-link same-tab url="/tos" text="Terms of Service" />
    <external-link
      url="https://rotki.readthedocs.io/en/latest/faq.html"
      text="FAQ"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'FooterLegalese',
})
</script>

<style module lang="scss">
@import '~assets/css/main';
@import '~assets/css/media';

.links {
  @apply flex flex-row flex-wrap;

  @include for-size(phone-only) {
    @apply justify-center;
  }

  > * {
    margin-left: 8px;
    margin-right: 8px;
  }
}
</style>
