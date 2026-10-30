<script lang="ts" setup>
import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import type { ValidationErrors } from '~/types/common';
import type {
  SignupAccountPayload,
  SignupAddressPayload,
  SignupCustomerInformationPayload,
  SignupPayload,
} from '~/types/signup';
import { SigilEvents, SignupFailedReasons } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import SignupAccount from '~/components/account/signup/SignupAccount.vue';
import SignupAddress from '~/components/account/signup/SignupAddress.vue';
import SignupCustomerInformation from '~/components/account/signup/SignupCustomerInformation.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useRecaptcha } from '~/composables/use-recaptcha';
import { useRedirectUrl } from '~/composables/use-redirect-url';
import { getSingleRouteParam } from '~/utils/query';
import { getSafeRedirectUrl } from '~/utils/redirect';

const { t } = useI18n({ useScope: 'global' });

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
  newsletterConsent: false,
});

const loading = ref<boolean>(false);
const externalResults = ref<ValidationErrors>({});
const step = ref<number>(1);

const steps = computed<{ title: string; description: string }[]>(() => [
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
]);

const stepLabel = computed<string>(() => t('auth.signup.step_label', {
  current: get(step),
  total: get(steps).length,
  title: get(steps)[get(step) - 1]?.title ?? '',
}));

const route = useRoute();
const { modelCaptchaId, resetCaptcha } = useRecaptcha();
const { fetchWithCsrf } = useFetchWithCsrf();
const { saveRedirectUrl } = useRedirectUrl();
const { chronicle } = useSigilEvents();

onMounted(() => {
  chronicle(SigilEvents.SIGNUP_STARTED, {});
});

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
      chronicle(SigilEvents.SIGNUP_COMPLETED, {});
      const redirectUrl = getSingleRouteParam(route.query.redirectUrl);
      if (redirectUrl) {
        const safeUrl = getSafeRedirectUrl(redirectUrl);
        if (safeUrl !== '/home/subscription')
          saveRedirectUrl(payload.username, safeUrl);
      }

      await navigateTo({ path: '/activation' });
    }
    else if (typeof message === 'object') {
      chronicle(SigilEvents.SIGNUP_FAILED, { reason: SignupFailedReasons.VALIDATION });
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
      chronicle(SigilEvents.SIGNUP_FAILED, { reason: SignupFailedReasons.VALIDATION });
      resetCaptcha();
      setErrors(error.data.message);
    }
    else {
      chronicle(SigilEvents.SIGNUP_FAILED, { reason: SignupFailedReasons.SERVER_ERROR });
    }
  }
  set(loading, false);
}

function back() {
  set(step, Math.max(get(step) - 1, 1));
}

function next() {
  set(step, Math.min(get(step) + 1, steps.value.length));
}

function haveIntersectionKeys(obj1: object, obj2: object) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  return keys1.some(key => keys2.includes(key));
}

function setErrors(errors: ValidationErrors) {
  set(externalResults, errors);

  if (haveIntersectionKeys(errors, get(accountForm)))
    set(step, 1);

  else if (haveIntersectionKeys(errors, get(customerInformationForm)))
    set(step, 2);

  else if (haveIntersectionKeys(errors, get(addressForm)))
    set(step, 3);
}
</script>

<template>
  <div class="container py-12 md:py-20 lg:py-24">
    <div class="flex justify-center gap-24">
      <div class="w-full max-w-[440px] flex flex-col">
        <p
          class="lg:sr-only mb-3 text-body-2 text-rui-text-secondary"
          data-cy="step-label"
          aria-live="polite"
        >
          {{ stepLabel }}
        </p>
        <SignupAccount
          v-if="step === 1"
          v-model="accountForm"
          :external-results="externalResults"
          @next="next()"
        />
        <SignupCustomerInformation
          v-if="step === 2"
          v-model="customerInformationForm"
          :external-results="externalResults"
          @back="back()"
          @next="next()"
        />
        <SignupAddress
          v-if="step === 3"
          v-model="addressForm"
          v-model:captcha-id="modelCaptchaId"
          :loading="loading"
          :external-results="externalResults"
          @back="back()"
          @finish="signup($event)"
        />
        <p
          v-if="step === 1"
          class="mt-8 pt-6 border-t border-default text-body-2 text-rui-text-secondary text-center"
        >
          {{ t('auth.signup.already_have_account') }}
          <ButtonLink
            :to="{
              path: '/login',
              query: route.query,
            }"
            inline
            color="primary"
          >
            {{ t('auth.login.title') }}
          </ButtonLink>
        </p>
      </div>

      <aside class="hidden lg:block w-[280px] shrink-0 -mt-3">
        <RuiStepper
          custom
          orientation="vertical"
          :step="step"
          :steps="steps"
        />
      </aside>
    </div>
  </div>
</template>
