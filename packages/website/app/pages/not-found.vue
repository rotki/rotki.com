<script lang="ts" setup>
import NotFoundError from '~/components/error/NotFoundError.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

// Statically rendered 404 body. `404.html` cannot serve this purpose: Nuxt's
// nitro-server always prerenders it as an un-hydrated SPA fallback shell, so it
// is blank without JavaScript. This page is a normal route, so SSR bakes the
// real markup in, and the Go static handler returns it with a 404 status
// (see `notFound` in spa-routes.json).
//
// No <NuxtLayout> wrapper here: unlike app/error.vue, which sits outside the
// layout system and must add one, a page already gets the default layout, so
// wrapping would render the header and footer twice.
//
// `link-home` renders the call to action as an anchor rather than a click
// handler, because the served 404 body has its scripts stripped and no
// JavaScript runs.
const { t } = useI18n({ useScope: 'global' });

usePageSeoNoIndex(t('not_found.title'));
</script>

<template>
  <div class="container text-center">
    <NotFoundError
      :status-code="404"
      link-home
    />
  </div>
</template>
