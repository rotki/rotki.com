<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <div :class="css.links">
    <ExternalLink same-tab text="Impressum" url="/impressum" />
    <ExternalLink same-tab text="Privacy Policy" url="/privacy-policy" />
    <ExternalLink same-tab text="Terms of Service" url="/tos" />
    <ExternalLink
      no-ref
      text="FAQ"
      url="https://rotki.readthedocs.io/en/latest/faq.html"
    />
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.links {
  @apply flex flex-row flex-wrap justify-center md:justify-start;

  > * {
    margin-left: 8px;
    margin-right: 8px;
  }
}
</style>
