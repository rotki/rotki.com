<script lang="ts" setup>
import { SigilEvents } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import GenericError from '~/components/error/GenericError.vue';
import NotFoundError from '~/components/error/NotFoundError.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

defineOptions({
  inheritAttrs: false,
});

const error = useError();

const title = computed<string>(() => get(error)?.message ?? '');

const statusCode = computed<number>(() => get(error)?.status ?? -1);

const isClientError = computed<boolean>(() => {
  const code = get(statusCode);
  return code >= 404 && code < 500;
});

usePageSeoNoIndex(title);

const { chronicle } = useSigilEvents();
const route = useRoute();

if (get(statusCode) === 404) {
  chronicle(SigilEvents.PAGE_NOT_FOUND, {
    path: route.fullPath,
  });
}

function handleError() {
  return clearError({ redirect: '/' });
}
</script>

<template>
  <NuxtLayout>
    <div
      v-if="error"
      class="container text-center"
    >
      <NotFoundError
        v-if="isClientError"
        :status-code="statusCode"
        @handle-error="handleError()"
      />
      <GenericError
        v-else
        :title="title"
        :status-code="statusCode"
        @handle-error="handleError()"
      />
    </div>
  </NuxtLayout>
</template>
