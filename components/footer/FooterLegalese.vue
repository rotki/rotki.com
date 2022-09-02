<template>
  <div :class="$style.links">
    <external-link same-tab text="Impressum" url="/impressum" />
    <external-link same-tab text="Privacy Policy" url="/privacy-policy" />
    <external-link same-tab text="Terms of Service" url="/tos" />
    <external-link
      no-ref
      text="FAQ"
      url="https://rotki.readthedocs.io/en/latest/faq.html"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'FooterLegalese',
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.links {
  @apply flex flex-row flex-wrap justify-center md:justify-start;

  > * {
    margin-left: 8px;
    margin-right: 8px;
  }
}
</style>
