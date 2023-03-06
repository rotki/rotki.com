<template>
  <JobsContent />
</template>

<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata'

const metadata = (route: string, baseUrl: string) => {
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
    getMetadata(title, description, `${baseUrl}/jobs/${path}`, baseUrl),
    title,
  ] as const
}

const route = useRoute()
const config = useRuntimeConfig()
const [meta, title] = metadata(route.path, config.baseUrl)

useHead({
  title,
  meta,
  ...commonAttrs(),
})

definePageMeta({
  redirect: '/jobs/backend',
})
</script>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
