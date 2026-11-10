<script lang="ts" setup>
import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import type { ValidationErrors } from '~/types/common';
import type { SignupAccountPayload, SignupInvoicePayload, SignupPayload } from '~/types/signup';
import { SigilEvents, SignupFailedReasons } from '@rotki/sigil';
import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import SignupAccount from '~/components/account/signup/SignupAccount.vue';
import SignupAside from '~/components/account/signup/SignupAside.vue';
import SignupInvoiceDetails from '~/components/account/signup/SignupInvoiceDetails.vue';
import SignupSteps from '~/components/account/signup/SignupSteps.vue';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useRedirectUrl } from '~/composables/use-redirect-url';
import { getSingleRouteParam } from '~/utils/query';
import { getSafeRedirectUrl } from '~/utils/redirect';

const route = useRoute();

const accountForm = ref<SignupAccountPayload>({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
});

const invoiceForm = ref<SignupInvoicePayload>({
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
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

const { fetchWithCsrf } = useFetchWithCsrf();
const { saveRedirectUrl } = useRedirectUrl();
const { chronicle } = useSigilEvents();

async function signup(recaptchaToken: string): Promise<void> {
  set(loading, true);

  const payload: SignupPayload = {
    ...get(accountForm),
    ...get(invoiceForm),
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

      // History state, not the query: the address must not end up in the URL.
      await navigateTo({ path: '/activation', state: { email: payload.email } });
    }
    else if (typeof message === 'object') {
      chronicle(SigilEvents.SIGNUP_FAILED, { reason: SignupFailedReasons.VALIDATION });
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
      setErrors(error.data.message);
    }
    else {
      chronicle(SigilEvents.SIGNUP_FAILED, { reason: SignupFailedReasons.SERVER_ERROR });
    }
  }
  set(loading, false);
}

function back(): void {
  set(step, 1);
}

function next(): void {
  set(step, 2);
}

function setErrors(errors: ValidationErrors): void {
  set(externalResults, errors);
  const accountFields = Object.keys(get(accountForm));
  set(step, Object.keys(errors).some(key => accountFields.includes(key)) ? 1 : 2);
}

onMounted(() => {
  chronicle(SigilEvents.SIGNUP_STARTED, {});
});
</script>

<template>
  <div class="container py-6 md:py-12 lg:py-14">
    <div class="mx-auto max-w-[1040px] flex flex-col lg:flex-row lg:items-start gap-14">
      <SignupAside
        class="hidden lg:block lg:flex-1 lg:min-w-0"
        :step="step"
        :username="accountForm.username"
        :email="accountForm.email"
        @edit="back()"
      />

      <section class="w-full md:mx-auto md:max-w-[500px] lg:mx-0 lg:shrink-0 md:rounded-2xl md:border md:border-default md:bg-white md:p-10 md:shadow-sm">
        <SignupSteps
          class="mb-6 md:mb-8"
          :step="step"
        />

        <!-- Kept alive so going back to step 1 keeps step 2's fields and solved captcha. -->
        <KeepAlive>
          <SignupAccount
            v-if="step === 1"
            v-model="accountForm"
            :external-results="externalResults"
            @next="next()"
          />
          <SignupInvoiceDetails
            v-else
            v-model="invoiceForm"
            :email="accountForm.email"
            :loading="loading"
            :external-results="externalResults"
            @back="back()"
            @finish="signup($event)"
          />
        </KeepAlive>
      </section>
    </div>
  </div>
</template>
