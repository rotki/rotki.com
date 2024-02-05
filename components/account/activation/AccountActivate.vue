<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useMainStore } from '~/store';
import { fetchWithCsrf } from '~/utils/api';

const route = useRoute();
const { uid, token } = route.params;
const validating = ref(true);
const isValid = ref(false);

const { getAccount } = useMainStore();

async function validateToken() {
  try {
    await fetchWithCsrf(`/webapi/activate/${uid}/${token}/`);
    set(isValid, true);
  }
  catch (error: any) {
    if (!(error instanceof FetchError && error.status === 404))
      logger.debug(error);
  }
  finally {
    set(validating, false);
  }
}

onBeforeMount(async () => {
  await validateToken();
  if (get(isValid))
    await getAccount();
});
const { t } = useI18n();
</script>

<template>
  <div
    class="container py-16 lg:pt-[200px] lg:pb-32 flex flex-col items-center justify-center"
  >
    <div class="w-[380px] max-w-full">
      <div
        v-if="validating"
        class="flex justify-center"
      >
        <RuiProgress
          variant="indeterminate"
          circular
          color="primary"
        />
      </div>
      <div
        v-else-if="!isValid"
        class="space-y-3"
      >
        <div class="text-h4">
          {{ t('auth.activation.invalid.title') }}
        </div>
        <div class="text-body-1 text-rui-text-secondary">
          {{ t('auth.activation.invalid.message') }}
        </div>
      </div>
      <div
        v-else
        class="space-y-3"
      >
        <div class="text-h4">
          {{ t('auth.activation.success.title') }}
        </div>
        <div class="text-body-1 text-rui-text-secondary">
          <span>
            {{ t('auth.activation.success.message') }}
          </span>
          <ButtonLink
            to="/home/subscription"
            inline
            color="primary"
          >
            {{ t('common.here') }}
          </ButtonLink>
        </div>
      </div>
    </div>
  </div>
</template>
