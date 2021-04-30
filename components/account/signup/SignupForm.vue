<template>
  <div :class="$style.wrapper">
    <Header>
      <template #subtitle>
        <div :class="$style.subtitle">Create a rotki premium Account</div>
      </template>
    </Header>

    <div :class="$style.row">
      <div :class="$style.column">
        <div :class="$style.hint">
          <span :class="$style.important">Important</span> Note: Creating an
          account in rotki.com is only needed to purchase a
          <a href="/products" :class="$style.link">premium subscription</a> .
          Rotki is a local application and the account you create when you use
          it is stored on your computer. This is not the same account as premium
          and credentials for one account don't work for the other. To use Rotki
          simply
          <a
            href=" https://github.com/rotki/rotki/releases/tag/latest"
            :class="$style.link"
            >download</a
          >
          and run it. Proceed only if you intend to purchase premium and unlock
          the premium features of the application.
        </div>

        <div :class="$style.section">Account</div>

        <div :class="$style.inputs">
          <input-field
            id="username"
            v-model="username"
            label="Username"
            hint="Required: Provide a unique username for your new account."
          />
          <input-field
            id="email"
            v-model="email"
            type="email"
            label="Email"
            hint="Required. Provide a valid email address."
          />
          <input-field
            id="github"
            v-model="github"
            label="Github Username"
            hint="Optional. Provide Github username for in-Github support."
          />
          <input-field
            id="password"
            v-model="password"
            type="password"
            label="Password"
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
            v-model="passwordConfirmation"
            type="password"
            label="Password Confirmation"
            hint="Enter the same password as before, for verification."
          />
        </div>

        <div :class="$style.section">Customer Information</div>

        <div :class="$style.inputs">
          <input-field
            id="first-name"
            v-model="firstName"
            label="First Name"
            hint="Required. Will only be used for invoice of payments."
          />
          <input-field
            id="last-name"
            v-model="lastName"
            label="Last Name"
            hint="Required. Will only be used for invoice of payments."
          />
          <input-field
            id="company-name"
            v-model="companyName"
            label="Company Name"
            hint="Optional. If you want to be invoiced as a company the given company name will be added to the invoice."
          />
          <input-field
            id="vat-id"
            v-model="vatId"
            label="VAT ID"
            hint="Optional. If you want to be invoiced as a company, the provided VAT ID will be added to the invoice."
          />
        </div>

        <div :class="$style.section">Address</div>

        <div :class="$style.inputs">
          <input-field
            id="address-1"
            v-model="address1"
            label="Address line 1"
            hint="Required. Will only be used for invoice of payments."
          />
          <input-field
            id="address-2"
            v-model="address2"
            label="Address line 2"
            hint="Optional. Additional data for the address."
          />
          <input-field
            id="city"
            v-model="city"
            label="City"
            hint="Required. Will only be used for invoice of payments."
          />
          <input-field
            id="postal"
            v-model="postal"
            label="Postal code"
            hint="Required. Will only be used for invoice of payments."
          />
          <input-field
            id="country"
            v-model="country"
            type="select"
            label="Country"
            hint="Required. Will only be used for invoice of payments."
          />
        </div>

        <recaptcha :class="$style.recaptcha" />

        <label :class="$style.termsCheck">
          <input type="checkbox" :class="$style.checkbox" checked />
          <span :class="$style.terms">
            I have read and agreed to the
            <a href="/terms" :class="$style.link">Terms of Service</a> and the
            <a href="/privacy-policy" :class="$style.link">Privacy Policy</a>
          </span>
        </label>

        <action-button primary text="Create Account" :class="$style.button" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'SignupForm',
  data() {
    return {
      username: '',
      password: '',
      passwordConfirmation: '',
      email: '',
      github: '',
      confirmation: '',
      firstName: '',
      lastName: '',
      companyName: '',
      vatId: '',
      address1: '',
      address2: '',
      city: '',
      postal: '',
      country: '',
    }
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply container mx-auto;

  @include for-size(phone-only) {
    padding: $mobile-margin / 2;
  }
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  font-size: 0.66rem;
  text-align: center;
  text-transform: uppercase;
}

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

.section {
  @apply font-serif;

  margin-top: 48px;

  @include text-size(24px, 32px);
}

.inputs {
  margin-top: 12px;
  > * {
    margin-top: 24px;
  }
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

.link {
  @apply hover:text-shade8 text-primary;
}

.button {
  margin-top: 48px;
}

.recaptcha {
  margin-top: 48px;
}
</style>
