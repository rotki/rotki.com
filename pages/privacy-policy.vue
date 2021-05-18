<template>
  <privacy-policy-content />
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'PrivacyPolicy',
  head: () => {
    return {
      title: 'Rotki: Privacy Policy',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Read the privacy policy',
        },
      ],
      htmlAttrs: {
        class: 'page',
      },
      bodyAttrs: {
        class: 'body',
      },
    }
  },
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
