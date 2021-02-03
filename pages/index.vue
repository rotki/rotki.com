<template>
  <div>
    <Header />
    <hero />
    <features />
    <premium />
    <plans />
    <page-footer />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  head: () => {
    return {
      title: 'Rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'A portfolio tracking, analytics, accounting and tax reporting application that protects your privacy',
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
