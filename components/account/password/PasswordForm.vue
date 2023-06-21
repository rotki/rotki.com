<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { email, required } from '@vuelidate/validators';
import { FetchError } from 'ofetch';
import { get, set } from '@vueuse/core';
import { fetchWithCsrf } from '~/utils/api';
import { logger } from '~/utils/logger';

const emailAddress = ref('');
const loading = ref(false);

const {
  onError,
  onExpired,
  onSuccess,
  resetCaptcha,
  captchaId,
  recaptchaToken,
} = useRecaptcha();

const rules = {
  email: { required, email },
  captcha: { required },
};

const $externalResults = ref({});
const v$ = useVuelidate(
  rules,
  { email: emailAddress, captcha: recaptchaToken },
  {
    $autoDirty: true,
    $externalResults,
  },
);

const reset = async () => {
  set(loading, true);
  try {
    await fetchWithCsrf<void>('/webapi/password-reset/request/', {
      method: 'post',
      body: {
        captcha: get(recaptchaToken),
        email: get(emailAddress),
      },
    });
    await navigateTo({
      path: '/password/send',
    });
  } catch (e: any) {
    if (
      e instanceof FetchError &&
      e.status === 400 &&
      e.data?.message?.captcha
    ) {
      resetCaptcha();
      set($externalResults, e.data.message);
    }

    logger.error(e);
  }
  set(loading, false);
};

const { t } = useI18n();
</script>

<template>
  <div
    class="container py-16 lg:pt-[200px] lg:pb-32 flex flex-col items-center justify-center"
  >
    <div class="w-[360px] space-y-8">
      <div class="text-h4">{{ t('auth.recover_password.title') }}</div>

      <form class="space-y-6" @submit.prevent="">
        <div class="space-y-5">
          <RuiTextField
            id="email"
            v-model="emailAddress"
            dense
            variant="outlined"
            :label="t('auth.common.email')"
            autocomplete="email"
            hide-details
            color="primary"
          />

          <Recaptcha
            v-model:captcha-id="captchaId"
            :invalid="v$.captcha.$invalid && v$.captcha.$dirty"
            @error="onError()"
            @expired="onExpired()"
            @success="onSuccess($event)"
          />
        </div>
        <RuiButton
          color="primary"
          :disabled="v$.$invalid || loading"
          class="w-full"
          size="lg"
          :loading="loading"
          @click="reset()"
        >
          {{ t('actions.submit') }}
        </RuiButton>
      </form>
    </div>
  </div>
</template>
