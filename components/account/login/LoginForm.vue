<template>
  <fragment>
    <div :class="$style.wrapper">
      <div :class="$style.row">
        <div :class="$style.column">
          <div :class="$style.header">
            <div :class="$style.title">Rotki</div>
            <div :class="$style.subtitle">Premium account management</div>
          </div>

          <div :class="$style.inputs">
            <div :class="$style.signin">Sign in</div>

            <input
              v-model="username"
              type="text"
              :class="$style.input"
              placeholder="Username"
            />
            <input
              v-model="password"
              type="password"
              :class="$style.input"
              placeholder="Password"
            />

            <div :class="$style.reset">
              <a href="/forgotpassword">Forgot password</a>
            </div>

            <button :class="$style.button">Sign in</button>
            <div :class="$style.create">
              First time premium?
              <a href="/signup" :class="$style.signup"> Sign Up here </a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div :class="$style.hint">
      <div>
        Here you can create or login to your premium account. A premium account
        is only needed to unlock the premium features of the application and is
        not the same as the account you use in the Rotki application.
        Credentials for one account can not be used for the other.
      </div>
    </div>
  </fragment>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
    }
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply w-screen h-screen flex flex-row items-center justify-center;

  @include for-size(phone-only) {
    padding: $mobile-margin / 2;
  }
}

.header {
  padding-bottom: 20px;
  @include for-size(phone-only) {
    padding-bottom: $mobile-margin / 2;
    padding-top: $mobile-margin;
  }
}

.title {
  @apply font-serif font-bold text-primary;

  @include text-size(52px, 67px);
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  font-size: 0.66rem;
  text-transform: uppercase;
}

.row {
  @apply flex flex-row mx-auto;

  @include for-size(tablet-portrait-up) {
    max-width: 340px;
    max-height: 340px;
  }
}

.column {
  @apply flex flex-col;
}

.input {
  @apply border-shade10 box-border border-solid focus:outline-none focus:border-primary py-2 px-3 appearance-none;

  margin-top: 16px;
  border-width: 1px;
  border-radius: 8px;
  height: 56px;
  width: 336px;

  @include for-size(phone-only) {
    width: 100%;
  }
}

.signin {
  @apply font-serif font-bold text-primary2;

  letter-spacing: -0.01em;

  @include text-size(32px, 47px);
  @include for-size(phone-only) {
    margin-top: 20px;
  }
}

.button {
  @apply text-white bg-primary hover:bg-shade12 font-sans focus:outline-none focus:ring-1 focus:ring-shade12 focus:ring-opacity-75;

  height: 56px;
  width: 336px;
  border-radius: 8px;

  @include for-size(phone-only) {
    width: 100%;
  }
}

.reset {
  @apply flex flex-row justify-end text-primary focus:text-yellow-800;

  width: 100%;
  margin-top: 24px;
  margin-bottom: 24px;
  @include for-size(phone-only) {
    margin-top: $mobile-margin / 2;
    margin-bottom: $mobile-margin / 2;
  }
}

.signup {
  @apply text-primary focus:text-yellow-800;
}

.create {
  padding-top: 16px;
}

.hint {
  position: absolute;
  align-items: center;
  text-align: justify;
  color: #808080;
  bottom: 40px;
  width: 100%;

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
</style>
