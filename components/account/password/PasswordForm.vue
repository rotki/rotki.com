<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core';
import { email, required } from '@vuelidate/validators';
import { fetchWithCsrf } from '~/utils/api';

const emailAddress = ref('');
const recaptcha = useRecaptcha();
// const { onError, onExpired, onSuccess } = recaptcha;

const rules = {
  email: { required, email },
};

const $externalResults = ref({});
const v$ = useVuelidate(
  rules,
  { email: emailAddress },
  {
    $autoDirty: true,
    $externalResults,
  }
);

const valid = computed((ctx) => !v$.value.$invalid && ctx.recaptchaPassed);

const reset = async () => {
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
};

const css = useCssModule();
const {
  public: {
    recaptcha: { siteKey },
  },
} = useRuntimeConfig();
</script>

<template>
  <PageContainer>
    <template #title> Reset your password</template>
    <div :class="css.content">
      <BoxContainer>
        <template #label> Recover password</template>
        <InputField id="email" v-model="emailAddress" filled label="Email" />
        <!--        <Recaptcha-->
        <!--          :class="css.recaptcha"-->
        <!--          @error="onError"-->
        <!--          @expired="onExpired"-->
        <!--          @success="onSuccess"-->
        <!--        />-->
        <div
          class="g-recaptcha"
          :class="css.recaptcha"
          :data-sitekey="siteKey"
        />
        <ActionButton
          :class="css.button"
          :disabled="!valid"
          primary
          small
          text="Submit"
          @click="reset"
        />
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
