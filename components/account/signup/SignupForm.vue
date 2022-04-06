<template>
  <page>
    <template #title> Create a rotki premium Account </template>

    <div :class="$style.row">
      <div :class="$style.column">
        <div :class="$style.hint">
          <span :class="$style.important">Important</span> Note: Creating an
          account in rotki.com is only needed to purchase a
          <external-link same-tab text="premium subscription" url="/products" />
          Rotki is a local application and the account you create when you use
          it is stored on your computer. This is not the same account as premium
          and credentials for one account don't work for the other. To use Rotki
          simply
          <external-link
            noreferrer
            text="download"
            url="https://github.com/rotki/rotki/releases/latest"
          />
          and run it. Proceed only if you intend to purchase premium and unlock
          the premium features of the application.
        </div>

        <heading :class="$style.heading">Account</heading>

        <div :class="$style.inputs">
          <input-field
            id="username"
            v-model="state.username"
            :error-messages="v$.username.$errors"
            hint="Required: Provide a unique username for your new account."
            label="Username"
          />
          <input-field
            id="email"
            v-model="state.email"
            :error-messages="v$.email.$errors"
            hint="Required. Provide a valid email address."
            label="Email"
            type="email"
          />
          <input-field
            id="github"
            v-model="state.githubUsername"
            :error-messages="v$.githubUsername.$errors"
            hint="Optional. Provide Github username for in-Github support."
            label="Github Username"
          />
          <input-field
            id="password"
            v-model="state.password"
            :error-messages="v$.password.$errors"
            label="Password"
            type="password"
          >
            <ul :class="$style.list">
              <li>
                Your password can't be too similar to your other personal
                information.
              </li>
              <li>Your password must contain at least 8 characters.</li>
              <li>Your password can't be a commonly used password.</li>

              <li>Your password can't be entirely numeric.</li>
            </ul>
          </input-field>

          <input-field
            id="password-confirmation"
            v-model="state.confirmPassword"
            :error-messages="v$.confirmPassword.$errors"
            hint="Enter the same password as before, for verification."
            label="Password Confirmation"
            type="password"
          />
        </div>

        <heading :class="$style.heading">Customer Information</heading>

        <div :class="$style.inputs">
          <input-field
            id="first-name"
            v-model="state.firstName"
            :error-messages="v$.firstName.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="First Name"
          />
          <input-field
            id="last-name"
            v-model="state.lastName"
            :error-messages="v$.lastName.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="Last Name"
          />
          <input-field
            id="company-name"
            v-model="state.companyName"
            hint="Optional. If you want to be invoiced as a company the given company name will be added to the invoice."
            label="Company Name"
          />
          <input-field
            id="vat-id"
            v-model="state.vatId"
            :error-messages="v$.vatId.$errors"
            hint="Optional. If you want to be invoiced as a company, the provided VAT ID will be added to the invoice."
            label="VAT ID"
          />
        </div>

        <heading :class="$style.heading">Address</heading>

        <div :class="$style.inputs">
          <input-field
            id="address-1"
            v-model="state.address1"
            :error-messages="v$.address1.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="Address line 1"
          />
          <input-field
            id="address-2"
            v-model="state.address2"
            :error-messages="v$.address2.$errors"
            hint="Optional. Additional data for the address."
            label="Address line 2"
          />
          <input-field
            id="city"
            v-model="state.city"
            :error-messages="v$.city.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="City"
          />
          <input-field
            id="postal"
            v-model="state.postcode"
            :error-messages="v$.postcode.$errors"
            hint="Required. Will only be used for invoice of payments."
            label="Postal code"
          />

          <country-select
            id="country"
            v-model="state.country"
            :error-messages="v$.country.$errors"
            :countries="countries"
            hint="Required. Will only be used for invoice of payments."
            label="Country"
          />
        </div>

        <recaptcha
          :class="$style.recaptcha"
          @error="onError"
          @expired="onExpired"
          @success="onSuccess"
        />

        <label :class="$style.termsCheck">
          <input
            :class="$style.checkbox"
            :value="termsAccepted"
            type="checkbox"
            @click="termsAccepted = !termsAccepted"
          />
          <span :class="$style.terms">
            I have read and agreed to the
            <external-link text="Terms of Service" url="/tos" />
            and the
            <external-link text="Privacy Policy" url="/privacy-policy" />
          </span>
        </label>

        <action-button
          :class="$style.button"
          :disabled="!valid"
          primary
          text="Create Account"
          @click="signup(state)"
        />
      </div>
    </div>
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  reactive,
  Ref,
  ref,
  toRef,
  useContext,
  useRouter,
} from '@nuxtjs/composition-api'
import { email, minLength, required, sameAs } from '@vuelidate/validators'
import { useVuelidate } from '@vuelidate/core'
import { setupCSRF } from '~/composables/csrf-token'
import { loadCountries } from '~/composables/countries'
import { setupRecaptcha } from '~/composables/repatcha'
import { SignupPayload } from '~/components/account/signup/types'

export default defineComponent({
  name: 'SignupForm',
  setup() {
    const state = reactive<SignupPayload>({
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
    })

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
      postcode: { required },
      country: { required },
    }

    const $externalResults = ref({})
    const v$ = useVuelidate(rules, state, {
      $autoDirty: true,
      $externalResults,
    })
    const termsAccepted = ref(false)
    const valid = computed(
      (ctx) => !v$.value.$invalid && ctx.termsAccepted && ctx.recaptchaPassed
    )
    setupCSRF()

    const recaptcha = setupRecaptcha()

    const setupSignup = (captcha: Ref<string>, $externalResults: Ref<any>) => {
      const { $api } = useContext()
      const router = useRouter()
      const signup = async (payload: SignupPayload) => {
        const response = await $api.post(
          '/webapi/signup/',
          {
            captcha: captcha.value,
            ...payload,
          },
          {
            validateStatus: (status) => [200, 400].includes(status),
          }
        )

        if (response.data && typeof response.data.message === 'object') {
          $externalResults.value = response.data.message
        }

        if (response.status === 200) {
          router.push({ path: '/activation' })
        }
      }
      return {
        signup,
      }
    }
    return {
      ...loadCountries(),
      ...recaptcha,
      ...setupSignup(recaptcha.recaptchaToken, $externalResults),
      valid,
      termsAccepted,
      state,
      v$,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

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
    bottom: $mobile-margin / 2;
    padding: $mobile-margin / 2;
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
  margin-top: 48px;
}
</style>
