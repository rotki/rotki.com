<template>
  <page>
    <template #title> Reset your password </template>

    <div :class="$style.content">
      <loader v-if="validating" />
      <user-action-message v-else-if="!isValid">
        <template #header>Invalid password reset link.</template>
        <p>
          The link you followed doesn't seem like a valid password reset link.
        </p>
      </user-action-message>
      <box v-else>
        <template #label> Provide your new password </template>
        <input-field
          id="password"
          v-model="password"
          :error-messages="v$.password.$errors"
          filled
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
          filled
          hint="Enter the same password as before, for verification."
          label="Password Confirmation"
          type="password"
        />
        <div :class="$style.buttonWrapper">
          <action-button
            :class="$style.button"
            :disabled="!valid"
            primary
            small
            text="Submit"
            @click="submit"
          />
        </div>
      </box>
    </div>
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
import { set } from '@vueuse/core'
import { setupCSRF } from '~/composables/csrf-token'

function setupTokenValidation() {
  const { $api } = useContext()
  const { value } = useRoute()
  const { uid, token } = value.params
  const validating = ref(true)
  const isValid = ref(true)

  async function validateToken() {
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
      set(isValid, false)
    }

    set(validating, false)
  }

  onMounted(async () => await validateToken())
  return { validating, isValid }
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
.button {
  @apply mt-16;
}

.buttonWrapper {
  @apply flex flex-row align-middle justify-center;
}

.subtitle {
  @apply font-sans text-primary2 font-medium text-center uppercase text-xs;
}

.list {
  @apply text-xs list-disc pl-6 text-shade8;
}

.box {
  @apply border p-6 rounded w-full lg:w-96;
}

.label {
  @apply text-shade11 font-serif mb-4 text-lg;
}

.confirmation {
  @apply mt-2;
}

.content {
  @apply flex flex-row justify-center;
}
</style>
