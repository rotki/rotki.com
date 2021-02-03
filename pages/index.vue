<template>
  <div>
    <header />
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

<style>
.page {
  @apply bg-background bg-rotki-pattern bg-local bg-right-top bg-no-repeat;

  scroll-behavior: smooth;
}

.body {
  @apply bg-rotki-logo bg-local bg-left-top bg-no-repeat overflow-x-hidden;
}
</style>
