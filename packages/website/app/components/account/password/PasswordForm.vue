<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { email, helpers, required } from '@vuelidate/validators';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import AuthShell from '~/components/account/AuthShell.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import Recaptcha from '~/components/common/Recaptcha.client.vue';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useRecaptcha } from '~/composables/use-recaptcha';
import { useLogger } from '~/utils/use-logger';
import { toMessages } from '~/utils/validation';

const { t } = useI18n({ useScope: 'global' });

const emailAddress = ref<string>('');
const loading = ref<boolean>(false);
const $externalResults = ref<Record<string, string[]>>({});

const {
  onError,
  onSuccess,
  onExpired,
  recaptchaToken,
  modelCaptchaId,
  resetCaptcha,
} = useRecaptcha();

const emailMessage = t('auth.recover_password.email_invalid');

// Not $autoDirty: the e-mail error waits for blur or submit instead of showing on the first keystroke.
const v$ = useVuelidate(
  {
    email: {
      required: helpers.withMessage(emailMessage, required),
      email: helpers.withMessage(emailMessage, email),
    },
    captcha: { required },
  },
  { email: emailAddress, captcha: recaptchaToken },
  { $externalResults },
);

const logger = useLogger('password-form');
const { fetchWithCsrf } = useFetchWithCsrf();

function setCaptchaId(id: number): void {
  set(modelCaptchaId, id);
}

async function reset(): Promise<void> {
  if (get(loading))
    return;

  // Without $autoDirty nothing clears the server's captcha error when a new captcha is solved.
  get(v$).$clearExternalResults();
  if (!await get(v$).$validate())
    return;

  set(loading, true);
  try {
    await fetchWithCsrf<void>('/webapi/password-reset/request/', {
      method: 'POST',
      body: {
        captcha: get(recaptchaToken),
        email: get(emailAddress),
      },
    });
    // History state, not the query: the address must not end up in the URL.
    await navigateTo({
      path: '/password/send',
      state: { email: get(emailAddress) },
    });
  }
  catch (error: any) {
    if (
      error instanceof FetchError
      && error.status === 400
      && error.data?.message?.captcha
    ) {
      resetCaptcha();
      set($externalResults, error.data.message);
    }

    logger.error(error);
  }
  set(loading, false);
}
</script>

<template>
  <AuthShell
    :title="t('auth.recover_password.title')"
    :description="t('auth.recover_password.message')"
  >
    <form
      class="space-y-6"
      @submit.prevent="reset()"
    >
      <div class="space-y-5">
        <RuiTextField
          id="email"
          v-model="emailAddress"
          dense
          autofocus
          :label="t('auth.common.email')"
          autocomplete="email"
          details="auto"
          :error-messages="toMessages(v$.email)"
          color="primary"
          @blur="v$.email.$touch()"
        />

        <ClientOnly>
          <Recaptcha
            data-cy="recovery-captcha"
            :invalid="v$.captcha.$invalid && v$.captcha.$dirty"
            @error="onError()"
            @expired="onExpired()"
            @success="onSuccess($event)"
            @update:captcha-id="setCaptchaId($event)"
          />
        </ClientOnly>
      </div>
      <RuiButton
        color="primary"
        :disabled="loading"
        class="w-full"
        size="lg"
        type="submit"
        :loading="loading"
      >
        {{ t('auth.recover_password.submit') }}
      </RuiButton>
    </form>
    <template #footer>
      {{ t('auth.recover_password.remembered') }}
      <ButtonLink
        to="/login"
        inline
        color="primary"
      >
        {{ t('auth.login.title') }}
      </ButtonLink>
    </template>
  </AuthShell>
</template>
