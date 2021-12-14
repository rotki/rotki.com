<template>
  <card>
    <heading subheading>Account Details</heading>
    <input-field
      id="email"
      :value="email"
      disabled
      hint="At the moment user email can't be changed. Email us support@rotki.com if you need to do so."
      label="Email"
      readonly
      type="email"
    />

    <heading subheading>Change Password</heading>

    <input-field
      id="current-password"
      v-model="state.currentPassword"
      :error-messages="v$.currentPassword.$errors"
      hint="Enter your current account password. Only needed if you want to change password"
      label="Current Password"
      type="password"
    />

    <input-field
      id="new-password"
      v-model="state.newPassword"
      :error-messages="v$.newPassword.$errors"
      hint="Enter a new password for your account"
      label="New Password"
      type="password"
    />

    <input-field
      id="password-confirmation"
      v-model="state.passwordConfirmation"
      :error-messages="v$.passwordConfirmation.$errors"
      hint="Enter the same password as before, for verification."
      label="Password Confirmation"
      type="password"
    />

    <div :class="$style.row">
      <action-button
        :class="$style.confirm"
        :disabled="v$.$invalid"
        :loading="loading"
        primary
        small
        text="Change Password"
        @click="changePassword"
      >
        <spinner v-if="loading" class="animate-spin" />
      </action-button>
      <span v-if="success" :class="$style.success">
        <check /> Your password has changed was successfully.
      </span>
    </div>
  </card>
</template>
<script lang="ts">
import {
  computed,
  defineComponent,
  reactive,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import { useVuelidate } from '@vuelidate/core'
import { minLength, required, sameAs } from '@vuelidate/validators'
import { ActionResult, useMainStore } from '~/store'

export default defineComponent({
  name: 'ChangePassword',
  setup() {
    const loading = ref(false)
    const success = ref(false)
    const store = useMainStore()
    // pinia#852
    const { account } = toRefs(store)
    const email = computed(() => {
      const userAccount = account.value
      return !userAccount ? '' : userAccount.email
    })
    const state = reactive({
      currentPassword: '',
      newPassword: '',
      passwordConfirmation: '',
    })

    const { newPassword } = toRefs(state)

    const rules = {
      currentPassword: { required, minLength: minLength(8) },
      newPassword: { required, minLength: minLength(8) },
      passwordConfirmation: {
        required,
        sameAsPassword: sameAs(newPassword, 'new password'),
      },
    }
    const $externalResults = ref({})
    const v$ = useVuelidate(rules, state, {
      $autoDirty: true,
      $externalResults,
    })

    let pendingTimeout: any

    const changePassword = async () => {
      loading.value = true
      const result: ActionResult = await store.changePassword(state)
      loading.value = false
      if (result.message && typeof result.message !== 'string') {
        $externalResults.value = result.message
      }

      if (result.success) {
        success.value = true
        if (pendingTimeout) {
          clearTimeout(pendingTimeout)
          pendingTimeout = undefined
        }
        pendingTimeout = setTimeout(() => {
          success.value = false
        }, 4000)
        state.currentPassword = ''
        state.newPassword = ''
        state.passwordConfirmation = ''
        v$.value.$reset()
      }
    }

    return {
      email,
      state,
      loading,
      success,
      changePassword,
      v$,
    }
  },
})
</script>

<style lang="scss" module>
.confirm {
  @apply mt-4;
}

.row {
  @apply flex-row flex;
}

.success {
  @apply flex flex-row ml-4 mt-6 text-shade11 transition duration-300 ease-in-out;
}
</style>
