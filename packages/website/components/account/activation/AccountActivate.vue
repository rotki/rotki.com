<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import { useLogger } from '~/utils/use-logger';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();

const uid = route.params.uid as string;
const token = route.params.token as string;

const validating = ref<boolean>(true);
const isValid = ref<boolean>(false);
const error = ref<string | null>(null);

const mainStore = useMainStore();
const { requestRefresh } = useAccountRefresh();
const { account } = storeToRefs(mainStore);
const { getLastRedirectUrl } = useRedirectUrl();
const logger = useLogger('account-activation');
const { fetchWithCsrf } = useFetchWithCsrf();

const lastPaymentLink = computed<string | undefined>(() => {
  const accountVal = get(account);
  if (accountVal?.username) {
    return getLastRedirectUrl(accountVal.username);
  }
  return undefined;
});

async function validateActivationToken(): Promise<void> {
  if (!uid || !token) {
    set(error, 'Missing activation parameters');
    set(validating, false);
    return;
  }

  try {
    await fetchWithCsrf(`/webapi/activate/${uid}/${token}/`);
    set(isValid, true);
    set(error, null);
    logger.debug('Account activation successful');
  }
  catch (activationError: any) {
    if (activationError instanceof FetchError && activationError.status === 404) {
      set(error, 'Invalid or expired activation link');
    }
    else {
      set(error, 'Activation failed. Please try again.');
      logger.error('Activation error:', activationError);
    }
    set(isValid, false);
  }
  finally {
    set(validating, false);
  }
}

function handlePaymentRedirect(): void {
  const paymentLink = get(lastPaymentLink);
  if (paymentLink) {
    window.location.href = paymentLink;
  }
}

// Lifecycle hooks
onBeforeMount(async () => {
  await validateActivationToken();

  if (get(isValid)) {
    requestRefresh();
  }
});
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
            @click="handlePaymentRedirect()"
          >
            {{ t('common.here') }}
          </RuiButton>
        </div>
      </div>
    </div>
  </div>
</template>
