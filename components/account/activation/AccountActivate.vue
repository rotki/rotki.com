<script setup lang="ts">
import { set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { fetchWithCsrf } from '~/utils/api';

const route = useRoute();
const { uid, token } = route.params;
const validating = ref(true);
const isValid = ref(false);

const validateToken = async () => {
  try {
    await fetchWithCsrf(`/webapi/activate/${uid}/${token}/`);
    set(isValid, true);
  } catch (e: any) {
    if (!(e instanceof FetchError && e.status === 404)) {
      logger.debug(e);
    }
  } finally {
    set(validating, false);
  }
};

onBeforeMount(async () => await validateToken());
const { t } = useI18n();
</script>

<template>
  <div
    class="container py-16 lg:pt-[200px] lg:pb-32 flex flex-col items-center justify-center"
  >
    <div class="w-[380px] max-w-full">
      <div v-if="validating" class="flex justify-center">
        <RuiProgress variant="indeterminate" circular color="primary" />
      </div>
      <div v-else-if="!isValid" class="space-y-3">
        <div class="text-h4">{{ t('auth.activation.invalid.title') }}</div>
        <div class="text-body-1 text-rui-text-secondary">
          {{ t('auth.activation.invalid.message') }}
        </div>
      </div>
      <div v-else class="space-y-3">
        <div class="text-h4">{{ t('auth.activation.success.title') }}</div>
        <div class="text-body-1 text-rui-text-secondary">
          <span>
            {{ t('auth.activation.success.message') }}
          </span>
          <ButtonLink to="/home" inline color="primary">
            {{ t('common.here') }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
