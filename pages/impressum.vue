<template>
  <impressum-content />
</template>

<script>
import Vue from 'vue'

export default Vue.extend({
  head: () => {
    return {
      title: 'Rotki: Impressum',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Impressum',
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
@import '~assets/css/media';
@import '~assets/css/main';
</style>
