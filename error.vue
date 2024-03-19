<script lang="ts" setup>
import { get } from '@vueuse/core';
import { commonAttrs, noIndex } from '~/utils/metadata';
import GenericError from '~/components/error/GenericError.vue';

defineOptions({
  inheritAttrs: false,
});

const error = useError();

const title = computed(() => get(error)?.message ?? '');

useHead(() => ({
  title,
  meta: [noIndex()],
  ...commonAttrs(),
}));

const statusCode = computed(() => {
  const err = get(error);
  return err && 'statusCode' in err ? err.statusCode : -1;
});

const isClientError = computed(() => get(statusCode) >= 404 && get(statusCode) < 500);

const handleError = () => clearError({ redirect: '/' });
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
