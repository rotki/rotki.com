<script setup lang="ts">
import {
  email,
  helpers,
  minLength,
  required,
  sameAs,
} from '@vuelidate/validators';
import { useVuelidate } from '@vuelidate/core';
import { get } from '@vueuse/core';
import { type Ref } from 'vue';
import { FetchError } from 'ofetch';
import { type SignupPayload } from '~/types/signup';
import { fetchWithCsrf } from '~/utils/api';

const recaptcha = useRecaptcha();

const state = reactive<SignupPayload & { captcha: Ref<string> }>({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  githubUsername: '',
  firstName: '',
  lastName: '',
  companyName: '',
  vatId: '',
  address1: '',
  address2: '',
  city: '',
  postcode: '',
  country: '',
  captcha: recaptcha.recaptchaToken,
});

const rules = {
  username: { required },
  password: { required, minLength: minLength(8) },
  confirmPassword: {
    required,
    sameAsPassword: sameAs(toRef(state, 'password'), 'password'),
  },
  email: { required, email },
  githubUsername: {},
  firstName: { required },
  lastName: { required },
  companyName: {},
  vatId: {},
  address1: { required },
  address2: {},
  city: { required },
  postcode: {
    required,
    validateCode: helpers.withMessage(
      'Enter a valid postal code. Only alphabets, numbers, space and -',
      helpers.regex(/^[\d\sA-Za-z-]+$/)
    ),
  },
  country: { required },
  captcha: { required },
};

const loading = ref(false);
const captchaId = ref<number>();
const $externalResults = ref({});
const v$ = useVuelidate(rules, state, {
  $autoDirty: true,
  $externalResults,
});
const termsAccepted = ref(false);

const { recaptchaPassed, onError, onSuccess, onExpired } = recaptcha;

const setCaptchaId = (v: number) => {
  captchaId.value = v;
};

const useSignup = (
  captcha: Ref<string>,
  $externalResults: Ref<Record<string, string>>
) => {
  const signup = async (payload: SignupPayload) => {
    const isValid = await get(v$).$validate();

    if (!isValid) {
      return;
    }

    loading.value = true;

    try {
      await fetchWithCsrf<void>('/webapi/signup/', {
        method: 'post',
        body: {
          captcha: captcha.value,
          ...payload,
        },
      });
      await navigateTo({ path: '/activation' });
    } catch (e: any) {
      if (
        e instanceof FetchError &&
        e.status === 400 &&
        e.data &&
        typeof e.data.message === 'object'
      ) {
        window.grecaptcha?.reset(captchaId.value);
        onExpired();
        $externalResults.value = e.data.message;
      }
    }
    loading.value = false;
  };
  return {
    signup,
  };
};

const { countries } = useCountries();
const { signup } = useSignup(recaptcha.recaptchaToken, $externalResults);
const css = useCssModule();
</script>

<template>
  <PageContainer>
    <template #title> Create a rotki premium Account</template>

    <div :class="css.row">
      <div :class="css.column">
        <div :class="css.hint">
          <span :class="css.important">Important</span> Note: Creating an
          account in rotki.com is only needed to purchase a
          <ExternalLink same-tab text="premium subscription" url="/products" />
          Rotki is a local application and the account you create when you use
          it is stored on your computer. This is not the same account as premium
          and credentials for one account don't work for the other. To use Rotki
          simply
          <ExternalLink
            noreferrer
            text="download"
            url="https://github.com/rotki/rotki/releases/latest"
          />
          and run it. Proceed only if you intend to purchase premium and unlock
          the premium features of the application.
        </div>

        <TextHeading :class="css.heading">Account</TextHeading>

        <div :class="css.inputs">
          <InputField
            id="username"
            v-model="state.username"
            :error-messages="v$.username.$errors"
            hint="Required: Provide a unique username for your new account."
            label="Username"
            autocomplete="username"
            @blur="v$.username.$touch()"
          />
          <InputField
            id="email"
            v-model="state.email"
            :error-messages="v$.email.$errors"
            hint="Required. Provide a valid email address."
            label="Email"
            type="email"
            autocomplete="email"
            @blur="v$.email.$touch()"
          />
          <InputField
            id="github"
            v-model="state.githubUsername"
            :error-messages="v$.githubUsername.$errors"
            hint="Optional. Provide Github username for in-Github support."
            label="Github Username"
            @blur="v$.githubUsername.$touch()"
          />
          <InputField
            id="password"
            v-model="state.password"
            :error-messages="v$.password.$errors"
            label="Password"
            type="password"
            autocomplete="new-password"
            @blur="v$.password.$touch()"
          >
            <ul :class="css.list">
              <li>
                Your password can't be too similar to your other personal
                information.
              </li>
              <li>Your password must contain at least 8 characters.</li>
              <li>Your password can't be a commonly used password.</li>

              <li>Your password can't be entirely numeric.</li>
            </ul>
          </InputField>

          <InputField
            id="password-confirmation"
            v-model="state.confirmPassword"
            :error-messages="v$.confirmPassword.$errors"
            hint="Enter the same password as before, for verification."
            label="Password Confirmation"
            type="password"
            autocomplete="new-password"
            @blur="v$.confirmPassword.$touch()"
          />
        </div>

        <TextHeading :class="css.heading">Customer Information</TextHeading>

        <div :class="css.inputs">
          <InputField
            id="first-name"
            v-model="state.firstName"
            :error-messages="v$.firstName.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="First Name"
            autocomplete="given-name"
            @blur="v$.firstName.$touch()"
          />
          <InputField
            id="last-name"
            v-model="state.lastName"
            :error-messages="v$.lastName.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="Last Name"
            autocomplete="family-name"
            @blur="v$.lastName.$touch()"
          />
          <InputField
            id="company-name"
            v-model="state.companyName"
            hint="Optional. If you want to be invoiced as a company the given company name will be added to the invoice."
            label="Company Name"
            autocomplete="organization"
            @blur="v$.companyName.$touch()"
          />
          <InputField
            id="vat-id"
            v-model="state.vatId"
            :error-messages="v$.vatId.$errors"
            hint="Optional. If you want to be invoiced as a company, the provided VAT ID will be added to the invoice."
            label="VAT ID"
            @blur="v$.vatId.$touch()"
          />
        </div>

        <TextHeading :class="css.heading">Address</TextHeading>

        <div :class="css.inputs">
          <InputField
            id="address-1"
            v-model="state.address1"
            :error-messages="v$.address1.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="Address line 1"
            autocomplete="address-line1"
            @blur="v$.address1.$touch()"
          />
          <InputField
            id="address-2"
            v-model="state.address2"
            :error-messages="v$.address2.$errors"
            hint="Optional. Additional data for the address."
            label="Address line 2"
            autocomplete="address-line2"
            @blur="v$.address2.$touch()"
          />
          <InputField
            id="city"
            v-model="state.city"
            :error-messages="v$.city.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="City"
            autocomplete="address-level2"
            @blur="v$.city.$touch()"
          />
          <InputField
            id="postal"
            v-model="state.postcode"
            :error-messages="v$.postcode.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="Postal code"
            autocomplete="postal-code"
            @blur="v$.postcode.$touch()"
          />

          <CountrySelect
            id="country"
            v-model="state.country"
            :countries="countries"
            :error-messages="v$.country.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="Country"
            autocomplete="country"
            @blur="v$.country.$touch()"
          />
        </div>

        <Recaptcha
          id="signup-captcha"
          :class="css.recaptcha"
          :invalid="v$.captcha.$invalid && v$.captcha.$dirty"
          @error="onError()"
          @expired="onExpired()"
          @success="onSuccess($event)"
          @captcha-id="setCaptchaId($event)"
        />

        <label :class="css.termsCheck">
          <input
            id="tos"
            :class="css.checkbox"
            :value="termsAccepted"
            type="checkbox"
            @click="termsAccepted = !termsAccepted"
          />
          <span :class="css.terms">
            I have read and agreed to the
            <ExternalLink text="Terms of Service" url="/tos" />
            and the
            <ExternalLink text="Privacy Policy" url="/privacy-policy" />
          </span>
        </label>

        <ActionButton
          :class="css.button"
          :disabled="!termsAccepted || !recaptchaPassed || loading"
          :loading="loading"
          primary
          text="Create Account"
          @click="signup(state)"
        >
          <SpinnerIcon v-if="loading" class="animate-spin" />
        </ActionButton>
      </div>
    </div>
  </PageContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.row {
  @apply flex flex-row mx-auto;
}

.column {
  @apply flex flex-col;
}

.hint {
  @apply font-sans;

  margin-top: 48px;
  align-items: center;
  text-align: justify;
  color: #808080;

  div {
    margin-left: auto;
    margin-right: auto;
    max-width: 500px;
  }

  @include text-size(14px, 21px);
  @include for-size(phone-only) {
    bottom: calc($mobile-margin / 2);
    padding: calc($mobile-margin / 2);
  }
}

.inputs {
  margin-top: 12px;

  > * {
    margin-top: 24px;
  }
}

.heading {
  margin-top: 40px;
}

.checkbox {
  @apply h-5 w-5 text-primary;
}

.termsCheck {
  @apply inline-flex items-center mt-8;
}

.terms {
  @apply ml-2 text-primary2;
}

.list {
  @apply text-xs;

  list-style-type: circle;
  padding-left: $mobile-margin * 2;
  color: #808080;
}

.button {
  margin-top: 48px;
}

.recaptcha {
  @apply mt-12;
}
</style>
