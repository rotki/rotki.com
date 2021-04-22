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
  watch: {
    visible(visible: boolean) {
      document.body.style.overflowY = visible ? 'hidden' : 'auto'
    },
  },
})
</script>
