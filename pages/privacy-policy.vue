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
          content:
            'Information for the website visitors regarding our policies with the collection, use, and disclosure of Personal Information regarding the service usage',
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
