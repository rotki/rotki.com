<template>
  <page>
    <template #title> Reset your password </template>
    <div :class="$style.content">
      <box>
        <template #label> Recover password </template>
        <input-field id="email" v-model="emailAddress" filled label="Email" />
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
          small
          text="Submit"
          @click="reset"
        />
      </box>
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
.button {
  @apply mt-12;
}

.recaptcha {
  @apply mt-4 h-20;
}

.content {
  @apply flex flex-row justify-center;
}
</style>
