<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import { useLogger } from '~/utils/use-logger';

const route = useRoute();
const { uid, token } = route.params;
const validating = ref(true);
const isValid = ref(false);

const mainStore = useMainStore();
const { refreshUserData } = mainStore;
const { account } = storeToRefs(mainStore);
const logger = useLogger();
const { fetchWithCsrf } = useFetchWithCsrf();

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
    await refreshUserData();
});
const { t } = useI18n({ useScope: 'global' });

const { getLastRedirectUrl } = useRedirectUrl();

const lastPaymentLink = computed(() => {
  const accountVal = get(account);
  if (accountVal && accountVal.username)
    return getLastRedirectUrl(accountVal.username);

  return undefined;
});

function redirectToPaymentLink() {
  const paymentLink = get(lastPaymentLink);
  if (paymentLink)
    window.location.href = paymentLink;
}
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
        <div
          v-if="lastPaymentLink"
          class="text-body-1 text-rui-text-secondary border-t pt-3"
        >
          <span>
            {{ t('auth.activation.success.continue_payment') }}
          </span>
          <RuiButton
            :to="lastPaymentLink"
            color="primary"
            class="inline-flex py-0 !px-1 !text-[1em]"
            variant="text"
            @click="redirectToPaymentLink()"
          >
            {{ t('common.here') }}
          </RuiButton>
        </div>
      </div>
    </div>
  </div>
</template>
