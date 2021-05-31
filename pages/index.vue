<template>
  <fragment>
    <Header />
    <hero @download="visible = true" />
    <features @download="visible = true" />
    <premium />
    <plans />
    <page-footer />
    <download-dialog v-if="visible" @dismiss="visible = false" />
  </fragment>
</template>

<script lang="ts">
import Vue from 'vue'

const description =
  'Rotki is an open source portfolio tracker, accounting and analytics tool that respects your privacy.'

export default Vue.extend({
  data() {
    return {
      visible: false,
    }
  },
  head: () => {
    return {
      title: 'Rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: description,
        },
        // Open graph/FB sharing metadata
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://rotki.com/' },
        { property: 'og:title', content: 'rotki' },
        {
          property: 'og:description',
          content: description,
        },
        { property: 'og:image', content: '/img/rotki-media.png' },
        // Twitter sharing metadata
        { property: 'twitter:card', content: 'summary_large_image' },
        { property: 'twitter:url', content: 'https://rotki.com/' },
        { property: 'twitter:title', content: 'rotki' },
        {
          property: 'twitter:description',
          content: description,
        },
        { property: 'twitter:image', content: '/img/rotki-media.png' },
      ],
      htmlAttrs: {
        class: 'page',
      },
      bodyAttrs: {
        class: 'body',
      },
    }
  },
  watch: {
    visible(visible: boolean) {
      document.body.style.overflowY = visible ? 'hidden' : 'auto'
    },
  },
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
