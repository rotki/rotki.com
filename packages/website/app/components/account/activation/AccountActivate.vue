<script setup lang="ts">
import { ActivationFailedReasons, SigilEvents } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useRedirectUrl } from '~/composables/use-redirect-url';
import { useMainStore } from '~/store';
import { getSingleRouteParam } from '~/utils/query';
import { getSafeRedirectUrl } from '~/utils/redirect';
import { useLogger } from '~/utils/use-logger';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();

const uid = getSingleRouteParam(route.params.uid);
const token = getSingleRouteParam(route.params.token);

const validating = ref<boolean>(true);
const isValid = ref<boolean>(false);
const error = ref<string>();

const mainStore = useMainStore();
const { requestRefresh } = useAccountRefresh();
const { account } = storeToRefs(mainStore);
const { getLastRedirectUrl } = useRedirectUrl();
const logger = useLogger('account-activation');
const { fetchWithCsrf } = useFetchWithCsrf();
const { chronicle } = useSigilEvents();

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
    set(error, undefined);
    chronicle(SigilEvents.ACTIVATION_COMPLETED, {});
    logger.debug('Account activation successful');
  }
  catch (activationError: unknown) {
    if (activationError instanceof FetchError && activationError.status === 404) {
      set(error, 'Invalid or expired activation link');
      chronicle(SigilEvents.ACTIVATION_FAILED, { reason: ActivationFailedReasons.INVALID_TOKEN });
    }
    else {
      set(error, 'Activation failed. Please try again.');
      chronicle(SigilEvents.ACTIVATION_FAILED, { reason: ActivationFailedReasons.SERVER_ERROR });
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
    window.location.href = getSafeRedirectUrl(paymentLink);
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
  <AuthShell
    v-if="validating"
    loading
  />
  <AuthShell
    v-else-if="!isValid"
    icon="lu-link-2-off"
    tone="error"
    :title="t('auth.activation.invalid.title')"
    :description="t('auth.activation.invalid.message')"
  >
    <ButtonLink
      color="primary"
      variant="default"
      class="w-full"
      size="lg"
      to="/login"
    >
      {{ t('auth.login.title') }}
    </ButtonLink>
  </AuthShell>
  <AuthShell
    v-else
    icon="lu-circle-check"
    tone="success"
    :title="t('auth.activation.success.title')"
    :description="t('auth.activation.success.message')"
  >
    <div class="flex flex-col gap-3">
      <RuiButton
        v-if="lastPaymentLink"
        color="primary"
        class="w-full"
        size="lg"
        @click="handlePaymentRedirect()"
      >
        {{ t('auth.activation.success.continue_payment') }}
      </RuiButton>
      <ButtonLink
        :color="lastPaymentLink ? undefined : 'primary'"
        variant="default"
        class="w-full"
        size="lg"
        to="/home/subscription"
      >
        {{ t('auth.activation.success.go_to_account') }}
      </ButtonLink>
    </div>
  </AuthShell>
</template>
