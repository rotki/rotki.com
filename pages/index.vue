<template>
  <div>
    <div class="container mx-auto">
      <div class="mt-24 flex flex-row justify-center">
        <div class="header text-primary font-serif flex-col col-auto text-5xl">
          Rotki
        </div>
      </div>
      <div :class="$style.links">
        <links />
      </div>
    </div>
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
        class:
          'bg-background bg-rotki-pattern bg-local bg-right-top bg-no-repeat',
      },
      bodyAttrs: {
        class:
          'bg-rotki-logo bg-local bg-left-top bg-no-repeat overflow-x-hidden',
      },
    }
  },
})
</script>

<style module>
.links {
  @apply flex flex-row justify-center;

  margin-top: 2.7777rem;
}
</style>
