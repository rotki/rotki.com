<template>
  <TermsOfService />
</template>

<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'terms of service | rotki'
const description =
  'The terms and conditions outline the rules and regulations for the use of rotki.com Website and all services offered in the Premium Rotki subscription.'

const config = useRuntimeConfig()
const baseUrl = config.public.baseUrl

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/tos`, baseUrl),
  ...commonAttrs(),
})
</script>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
