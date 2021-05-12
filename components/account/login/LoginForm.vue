<template>
  <square-form>
    <template #subtitle> Premium account management </template>
    <template #hint>
      Here you can create or login to your premium account. A premium account is
      only needed to unlock the premium features of the application and is not
      the same as the account you use in the Rotki application. Credentials for
      one account can not be used for the other.
    </template>

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
  </square-form>
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
</style>
