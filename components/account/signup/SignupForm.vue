<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { fetchWithCsrf } from '~/utils/api';
import type {
  SignupAccountPayload,
  SignupAddressPayload,
  SignupCustomerInformationPayload,
  SignupPayload,
} from '~/types/signup';
import type { ValidationErrors } from '~/types/common';
import type { ApiResponse } from '~/types';

const { t } = useI18n();
const { captchaId, resetCaptcha } = useRecaptcha();

const accountForm = ref<SignupAccountPayload>({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
});

const customerInformationForm = ref<SignupCustomerInformationPayload>({
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
});

const addressForm = ref<SignupAddressPayload>({
  address1: '',
  address2: '',
  city: '',
  postcode: '',
  country: '',
});

const loading = ref<boolean>(false);
const externalResults = ref<ValidationErrors>({});

async function signup({
  recaptchaToken,
}: {
  recaptchaToken: string;
  onExpired: () => void;
}) {
  set(loading, true);

  const payload: SignupPayload = {
    ...get(accountForm),
    ...get(customerInformationForm),
    ...get(addressForm),
  };

  try {
    const { result, message } = await fetchWithCsrf<
      ApiResponse<boolean, ValidationErrors>
    >('/webapi/signup/', {
      method: 'POST',
      body: {
        captcha: recaptchaToken,
        ...payload,
      },
    });
    if (result) {
      await navigateTo({ path: '/activation' });
    }
    else if (typeof message === 'object') {
      resetCaptcha();
      setErrors(message);
    }
  }
  catch (error: any) {
    if (
      error instanceof FetchError
      && error.status === 400
      && error.data
      && typeof error.data.message === 'object'
    ) {
      resetCaptcha();
      setErrors(error.data.message);
    }
  }
  set(loading, false);
}

const step = ref<number>(1);
const steps = [
  {
    title: t('auth.signup.steps.step_1.title'),
    description: t('auth.signup.steps.step_1.description'),
  },
  {
    title: t('auth.signup.steps.step_2.title'),
    description: t('auth.signup.steps.step_2.description'),
  },
  {
    title: t('auth.signup.steps.step_3.title'),
    description: t('auth.signup.steps.step_3.description'),
  },
  {
    title: t('auth.signup.steps.step_4.title'),
    description: t('auth.signup.steps.step_4.description'),
  },
];

function back() {
  set(step, Math.max(get(step) - 1, 1));
}

function next() {
  set(step, Math.min(get(step) + 1, steps.length));
}

function haveIntersectionKeys(obj1: object, obj2: object) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  return keys1.some(key => keys2.includes(key));
}

function setErrors(errors: ValidationErrors) {
  set(externalResults, errors);

  if (haveIntersectionKeys(errors, get(accountForm)))
    set(step, 2);

  else if (haveIntersectionKeys(errors, get(customerInformationForm)))
    set(step, 3);

  else if (haveIntersectionKeys(errors, get(addressForm)))
    set(step, 4);
}
</script>

<template>
  <div
    class="container flex flex-col lg:flex-row py-8 lg:py-14 h-full grow"
  >
    <div class="flex justify-center grow">
      <form
        class="w-[440px] max-w-full flex flex-col justify-between"
        @submit.prevent=""
      >
        <SignupIntroduction
          v-if="step === 1"
          @next="next()"
        />
        <SignupAccount
          v-if="step === 2"
          v-model="accountForm"
          :external-results="externalResults"
          @back="back()"
          @next="next()"
        />
        <SignupCustomerInformation
          v-if="step === 3"
          v-model="customerInformationForm"
          :external-results="externalResults"
          @back="back()"
          @next="next()"
        />
        <SignupAddress
          v-if="step === 4"
          v-model="addressForm"
          v-model:captcha-id="captchaId"
          :loading="loading"
          :external-results="externalResults"
          @back="back()"
          @finish="signup($event)"
        />
        <div class="py-10 lg:px-4">
          <RuiFooterStepper
            :model-value="step"
            :pages="4"
            variant="pill"
          />
        </div>
      </form>
    </div>

    <div class="hidden lg:block w-[332px] sticky top-0 self-start">
      <RuiStepper
        custom
        orientation="vertical"
        :step="step"
        :steps="steps"
      />
    </div>
  </div>
</template>
