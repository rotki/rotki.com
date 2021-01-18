<template>
  <div class="container mx-auto">
    <div class="mt-24 flex flex-row justify-center">
      <div class="header text-primary font-serif flex-col col-auto text-5xl">
        Rotki
      </div>
    </div>
    <links />
    <hero />
    <middle-menu />
    <features />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  head: () => {
    return {
      htmlAttrs: {
        class:
          'bg-background bg-rotki-pattern bg-local bg-right-top bg-no-repeat',
      },
      bodyAttrs: {
        class: 'bg-rotki-logo bg-local bg-left-top bg-no-repeat',
      },
    }
  },
})
</script>
