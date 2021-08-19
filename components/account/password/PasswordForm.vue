<template>
  <page>
    <template #title> Reset your password </template>
    <div :class="$style.box">
      <div :class="$style.label">Recover password</div>
      <input-field id="email" v-model="emailAddress" label="Email" />
      <recaptcha
        :class="$style.recaptcha"
        @error="onError"
        @expired="onExpired"
        @success="onSuccess"
      />
      <action-button
        :class="$style.button"
        :disabled="!valid"
        primary
        text="Submit"
        @click="reset"
      />
    </div>
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  useContext,
  useRouter,
} from '@nuxtjs/composition-api'
import { useVuelidate } from '@vuelidate/core'
import { email, required } from '@vuelidate/validators'
import { setupRecaptcha } from '~/composables/repatcha'
import { setupCSRF } from '~/composables/csrf-token'

export default defineComponent({
  name: 'PasswordForm',
  setup() {
    const emailAddress = ref('')
    const recaptcha = setupRecaptcha()

    const rules = {
      email: { required, email },
    }

    const $externalResults = ref({})
    const v$ = useVuelidate(
      rules,
      { email: emailAddress },
      {
        $autoDirty: true,
        $externalResults,
      }
    )

    const valid = computed((ctx) => !v$.value.$invalid && ctx.recaptchaPassed)

    const { $api } = useContext()
    const router = useRouter()

    const reset = async () => {
      await $api.post('/webapi/password-reset/request/', {
        captcha: recaptcha.recaptchaToken.value,
        email: emailAddress.value,
      })
      router.push({
        path: '/password/send',
      })
    }
    setupCSRF()
    return {
      ...recaptcha,
      emailAddress,
      valid,
      v$,
      reset,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';

.box {
  @apply border p-6 rounded;

  width: 450px;

  @include for-size(phone-only) {
    width: 100%;
  }
}

.label {
  @apply text-shade11 font-serif mb-4;

  @include text-size(24px, 32px);
}

.button {
  margin-top: 48px;
}

.recaptcha {
  margin-top: 16px;
}
</style>
