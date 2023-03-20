<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { email, required } from '@vuelidate/validators';
import { FetchError } from 'ofetch';
import { fetchWithCsrf } from '~/utils/api';
import { logger } from '~/utils/logger';

const emailAddress = ref('');
const loading = ref(false);
const captchaId = ref<number>();
const recaptcha = useRecaptcha();
const { onError, onExpired, onSuccess } = recaptcha;

const rules = {
  email: { required, email },
  captcha: { required },
};

const $externalResults = ref({});
const v$ = useVuelidate(
  rules,
  { email: emailAddress, captcha: recaptcha.recaptchaToken },
  {
    $autoDirty: true,
    $externalResults,
  }
);

const setCaptchaId = (v: number) => {
  captchaId.value = v;
};

const reset = async () => {
  loading.value = true;
  try {
    await fetchWithCsrf('/webapi/password-reset/request/', {
      method: 'post',
      body: {
        captcha: recaptcha.recaptchaToken.value,
        email: emailAddress.value,
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
      window.grecaptcha?.reset(captchaId.value);
      onExpired();
      $externalResults.value = e.data.message;
    }

    logger.error(e);
  }
  loading.value = false;
};

const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title> Reset your password</template>
    <div :class="css.content">
      <BoxContainer>
        <template #label> Recover password</template>
        <InputField id="email" v-model="emailAddress" filled label="Email" />
        <Recaptcha
          :invalid="v$.captcha.$invalid && v$.captcha.$dirty"
          @error="onError"
          @expired="onExpired"
          @success="onSuccess"
          @captcha-id="setCaptchaId"
        />

        <ActionButton
          :class="css.button"
          :disabled="v$.$invalid || loading"
          :loading="loading"
          primary
          small
          text="Submit"
          @click="reset"
        >
          <SpinnerIcon v-if="loading" class="animate-spin" />
        </ActionButton>
      </BoxContainer>
    </div>
  </PageContainer>
</template>

<style lang="scss" module>
.button {
  @apply mt-12;
}

.recaptcha {
  @apply mt-4 h-20;
}

.content {
  @apply flex flex-row justify-center;
}
</style>
