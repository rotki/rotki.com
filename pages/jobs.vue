<template>
  <jobs-content />
</template>

<script lang="ts">
import Vue from 'vue'
import { getMetadata } from '~/utils/metadata'

function metadata(route: string) {
  let title = 'Rotki: Jobs'
  let description = 'Available roles and positions in the rotki team'
  let path = ''

  if (route.includes('backend')) {
    title = 'Rotki: Position for a Python Backend Developer'
    description =
      'We are looking for a backend developer to help us improve Rotki.'
    path = 'backend'
  } else if (route.includes('frontend')) {
    title = 'Rotki: Position for a Vue.js/TypeScript Developer'
    description =
      'We are looking for a passionate Vue.js developer with excellent knowledge of Typescript.'
    path = 'frontend'
  }

  return [
    getMetadata(title, description, `${process.env.BASE_URL}/jobs/${path}`),
    title,
  ] as const
}

export default Vue.extend({
  middleware: [
    function ({ redirect, route }) {
      if (['/jobs', '/jobs/'].includes(route.path)) {
        redirect('/jobs/backend')
      }
    },
  ],
  data() {
    return {
      visible: false,
    }
  },
  head() {
    // TODO: figure out why type augmentation fails when running generate
    const [meta, title] = metadata((this as any).$route.path)
    return {
      title,
      meta,
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
