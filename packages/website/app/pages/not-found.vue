<script lang="ts" setup>
import NotFoundError from '~/components/error/NotFoundError.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

/*
 * Statically rendered 404 body. Nuxt always prerenders `404.html` as an
 * un-hydrated SPA shell that is blank without JavaScript, so this normal route
 * has SSR bake the markup in and the Go static handler serves it with a 404
 * status (see `notFound` in spa-routes.json).
 */

/*
 * No <NuxtLayout> wrapper: unlike app/error.vue, a page already gets the default
 * layout, so wrapping would render the header and footer twice. `link-home`
 * makes the call to action an anchor, because the served 404 body has its
 * scripts stripped.
 */
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
