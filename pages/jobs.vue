<template>
  <jobs-content />
</template>

<script lang="ts">
import { defineComponent, useMeta, useRoute } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'
import { setupOverflow } from '~/composables/overflow'

function metadata(route: string) {
  let title = 'jobs | rotki'
  let description = 'Available roles and positions in the rotki team'
  let path = ''

  if (route.includes('backend')) {
    title = 'python backend developer | rotki'
    description =
      'We are looking for a backend developer to help us improve Rotki.'
    path = 'backend'
  } else if (route.includes('frontend')) {
    title = 'vue/typescript frontend developer | rotki'
    description =
      'We are looking for a passionate Vue.js developer with excellent knowledge of Typescript.'
    path = 'frontend'
  }

  return [
    getMetadata(title, description, `${process.env.baseUrl}/jobs/${path}`),
    title,
  ] as const
}

export default defineComponent({
  name: 'Jobs',
  middleware: [
    function ({ redirect, route }) {
      if (['/jobs', '/jobs/'].includes(route.path)) {
        redirect('/jobs/backend')
      }
    },
  ],
  setup() {
    const route = useRoute()
    const [meta, title] = metadata(route.value.path)
    useMeta({
      title,
      meta,
      ...commonAttrs(),
    })
    return setupOverflow()
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
