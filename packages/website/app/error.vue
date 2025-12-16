<script lang="ts" setup>
import { get } from '@vueuse/core';
import GenericError from '~/components/error/GenericError.vue';
import NotFoundError from '~/components/error/NotFoundError.vue';
import { commonAttrs, noIndex } from '~/utils/metadata';

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

useHead(() => ({
  title,
  meta: [noIndex()],
  ...commonAttrs(),
}));

function handleError() {
  return clearError({ redirect: '/' });
}
</script>

<template>
  <NuxtLayout name="landing">
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
