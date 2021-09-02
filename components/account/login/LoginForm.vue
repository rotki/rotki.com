<template>
  <page>
    <template #title> Premium account management </template>
    <template #hint>
      <div :class="$style.hint">
        Here you can create or login to your premium account. A premium account
        is only needed to unlock the premium features of the application and is
        not the same as the account you use in the Rotki application.
        Credentials for one account can not be used for the other.
      </div>
    </template>

    <box>
      <template #label>Sign in</template>
      <input-field
        id="username"
        v-model="username"
        placeholder="Username"
        type="text"
        @focus="error = ''"
      />
      <input-field
        id="password"
        v-model="password"
        placeholder="Password"
        type="password"
        @focus="error = ''"
        @keypress.enter="login"
      />

      <div :class="$style.errorWrapper">
        <div v-if="error" :class="$style.error">{{ error }}</div>
      </div>

      <div :class="$style.reset">
        <external-link
          same-tab
          text="Forgot password"
          url="/password/recover"
        />
      </div>

      <div :class="$style.button">
        <action-button
          :disabled="!valid"
          primary
          text="Sign in"
          @click="login"
        />
      </div>
      <div :class="$style.create">
        First time premium?
        <external-link same-tab text="Sign Up here" url="/signup" />
      </div>
    </box>
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  useRouter,
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
    const router = useRouter()
    const login = async () => {
      const credentials: LoginCredentials = {
        username: username.value,
        password: password.value,
      }
      error.value = await dispatch(Actions.LOGIN, credentials)

      if (!error.value) {
        router.push('/home')
      }
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

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.button {
  @apply flex flex-row align-middle justify-center;
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

.create {
  @apply flex flex-row align-middle justify-center;

  padding-top: 16px;
}

.error {
  @apply p-2 mt-1 text-red-500 text-xs;
}

.errorWrapper {
  min-height: 40px;
}

.hint {
  max-width: 500px;
  align-items: center;
  text-align: justify;
}
</style>
