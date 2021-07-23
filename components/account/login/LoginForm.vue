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
      :class="{
        [$style.input]: true,
        [$style.hasError]: !!error,
      }"
      placeholder="Username"
      @focus="error = ''"
    />
    <input
      v-model="password"
      type="password"
      :class="{
        [$style.input]: true,
        [$style.hasError]: !!error,
      }"
      placeholder="Password"
      @focus="error = ''"
      @keypress.enter="login"
    />

    <div :class="$style.errorWrapper">
      <div v-if="error" :class="$style.error">{{ error }}</div>
    </div>

    <div :class="$style.reset">
      <a href="/forgotpassword">Forgot password</a>
    </div>

    <button :class="$style.button" :disabled="!valid" @click="login">
      Sign in
    </button>
    <div :class="$style.create">
      First time premium?
      <a href="/signup" :class="$style.signup"> Sign Up here </a>
    </div>
  </square-form>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  useStore,
} from '@nuxtjs/composition-api'
import { Actions, LoginCredentials, RootState } from '~/store'
import { setupCSRF } from '~/composables/csrf-token'

export default defineComponent({
  name: 'Login',
  setup() {
    const username = ref('')
    const password = ref('')
    const valid = computed(({ username, password }) => !!username && !!password)
    const error = ref('')
    setupCSRF()
    const { dispatch } = useStore<RootState>()
    const login = async () => {
      const credentials: LoginCredentials = {
        username: username.value,
        password: password.value,
      }
      error.value = await dispatch(Actions.LOGIN, credentials)
    }
    return {
      username,
      password,
      valid,
      error,
      login,
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

.button:disabled {
  @apply bg-gray-400;
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

.error {
  @apply p-2 mt-1 text-red-500 text-xs;
}

.hasError {
  @apply border-red-500;
}

.errorWrapper {
  min-height: 40px;
}
</style>
