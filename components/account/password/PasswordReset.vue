<template>
  <page>
    <template #title> Reset your password </template>

    <div v-if="!validating" :class="$style.box">
      <div :class="$style.label">Provide your new password</div>
      <input-field
        id="password"
        v-model="password"
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
        v-model="passwordConfirmation"
        :class="$style.confirmation"
        :error-messages="v$.passwordConfirmation.$errors"
        hint="Enter the same password as before, for verification."
        label="Password Confirmation"
        type="password"
      />
      <action-button
        :class="$style.button"
        :disabled="!valid"
        primary
        text="Submit"
        @click="submit"
      />
    </div>
    <div v-else />
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  Ref,
  ref,
  useContext,
  useRoute,
  useRouter,
} from '@nuxtjs/composition-api'
import { useVuelidate } from '@vuelidate/core'
import { minLength, required, sameAs } from '@vuelidate/validators'
import { setupCSRF } from '~/composables/csrf-token'

function setupTokenValidation() {
  const { $api } = useContext()
  const { value } = useRoute()
  const router = useRouter()
  const { uid, token } = value.params
  const validating = ref(false)

  async function validateToken() {
    validating.value = true
    const response = await $api.post(
      '/webapi/password-reset/validate/',
      {
        uid,
        token,
      },
      {
        validateStatus: (status) => [200, 400, 404].includes(status),
      }
    )

    if (response.status === 400 || response.status === 404) {
      router.push({
        path: '/password/invalid-link',
      })
    } else {
      validating.value = false
    }
  }

  onMounted(async () => await validateToken())
  return { validating }
}

function setupFormValidation(
  password: Ref<string>,
  passwordConfirmation: Ref<string>,
  $externalResults: Ref<{}>
) {
  const rules = {
    password: { required, minLength: minLength(8) },
    passwordConfirmation: {
      required,
      sameAsPassword: sameAs(password, 'password'),
    },
  }

  const v$ = useVuelidate(
    rules,
    { password, passwordConfirmation },
    {
      $autoDirty: true,
      $externalResults,
    }
  )

  const valid = computed(() => !v$.value.$invalid)
  return { v$, valid }
}

export default defineComponent({
  name: 'PasswordForm',
  setup() {
    const password = ref('')
    const passwordConfirmation = ref('')
    const $externalResults = ref({})

    const router = useRouter()
    const { $api } = useContext()
    const { value } = useRoute()
    const { uid, token } = value.params
    const submit = async () => {
      const response = await $api.post(
        '/webapi/password-reset/confirm/',
        {
          uid,
          token,
          password: password.value,
          password_confirmation: passwordConfirmation.value,
        },
        {
          validateStatus: (status) => [200, 400, 404].includes(status),
        }
      )

      if (response.status === 404) {
        router.push({
          path: '/password/invalid-link',
        })
      } else if (response.status === 400) {
        const message = response.data.message
        if (message && typeof message === 'object') {
          $externalResults.value = {
            password: message.password,
            passwordConfirmation: message.password_confirmation,
          }
        }
      } else {
        router.push({
          path: '/password/changed',
        })
      }
    }

    setupCSRF()
    return {
      password,
      passwordConfirmation,
      ...setupTokenValidation(),
      submit,
      ...setupFormValidation(password, passwordConfirmation, $externalResults),
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.button {
  margin-top: 48px;
}

.subtitle {
  @apply font-sans text-primary2 font-medium;

  font-size: 0.66rem;
  text-align: center;
  text-transform: uppercase;
}

.list {
  @apply text-xs;

  list-style-type: circle;
  padding-left: $mobile-margin * 2;
  color: #808080;
}

.box {
  @apply border p-12 rounded;
}

.label {
  @apply text-shade11 font-sans mb-4;

  @include text-size(24px, 32px);
}

.confirmation {
  @apply mt-2;
}
</style>
