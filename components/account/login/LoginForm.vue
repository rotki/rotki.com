<template>
  <box>
    <template #label>Sign in</template>
    <input-field
      id="username"
      v-model="username"
      filled
      label="Username"
      type="text"
      @focus="error = ''"
    >
      <template #prepend>
        <span :class="$style.prepend">
          <user-icon />
        </span>
      </template>
    </input-field>
    <input-field
      id="password"
      v-model="password"
      :class="$style.password"
      :type="showPassword ? 'text' : 'password'"
      filled
      label="Password"
      @enter="login"
      @focus="error = ''"
    >
      <template #prepend>
        <span :class="$style.prepend">
          <password-icon />
        </span>
      </template>
      <template #append>
        <button :class="$style.show" @click="showPassword = !showPassword">
          <span v-if="showPassword">HIDE</span>
          <span v-else>SHOW</span>
        </button>
      </template>
    </input-field>

    <div :class="$style.errorWrapper">
      <div v-if="error" :class="$style.error">{{ error }}</div>
    </div>

    <div :class="$style.buttonContainer">
      <action-button
        :class="$style.button"
        :disabled="!valid"
        primary
        small
        text="Sign in"
        @click="login"
      />
    </div>

    <div :class="$style.reset">
      <external-link same-tab text="Forgot password?" url="/password/recover" />
    </div>

    <div :class="$style.divider" />

    <div :class="$style.create">
      First time premium?
      <external-link
        :class="$style.signup"
        same-tab
        text="Sign up now"
        url="/signup"
      />
    </div>
  </box>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  useRouter,
  useStore,
} from '@nuxtjs/composition-api'
import { setupCSRF } from '~/composables/csrf-token'
import { Actions, LoginCredentials, RootState } from '~/store'
import UserIcon from '~/components/account/login/icons/PasswordIcon.vue'

export default defineComponent({
  name: 'LoginForm',
  components: { UserIcon },
  setup() {
    const username = ref('')
    const password = ref('')
    const showPassword = ref(false)
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
      showPassword,
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

.buttonContainer {
  @apply flex flex-row align-middle justify-center mt-4;
}

.button {
  width: 288px;
}

.reset {
  @apply flex flex-row justify-center text-primary focus:text-yellow-800 mt-10 mb-6;

  width: 100%;

  @include for-size(phone-only) {
    margin-top: $mobile-margin / 2;
    margin-bottom: $mobile-margin / 2;
  }
}

.prepend {
  @apply p-3;
}

.password {
  @apply mt-5;
}

.show {
  @apply m-2 focus:outline-none;

  width: 56px;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0;
  color: #363f41;
}

.divider {
  @apply border border-solid border-typography opacity-20;

  width: 328px;
}

.create {
  @apply flex flex-row align-middle justify-center mt-6 mb-6;
}

.signup {
  @apply font-bold ml-2;
}

.error {
  @apply p-2 mt-1 text-error text-xs tracking-tight;
}

.errorWrapper {
  min-height: 40px;
}
</style>
