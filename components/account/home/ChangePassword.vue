<template>
  <CardContainer>
    <TextHeading subheading>Account Details</TextHeading>
    <InputField
      id="email"
      :model-value="email"
      disabled
      hint="At the moment user email can't be changed. Email us support@rotki.com if you need to do so."
      label="Email"
      readonly
      type="email"
    />

    <TextHeading subheading>Change Password</TextHeading>

    <InputField
      id="current-password"
      v-model="state.currentPassword"
      :error-messages="v$.currentPassword.$errors"
      hint="Enter your current account password. Only needed if you want to change password"
      label="Current Password"
      type="password"
    />

    <InputField
      id="new-password"
      v-model="state.newPassword"
      :error-messages="v$.newPassword.$errors"
      hint="Enter a new password for your account"
      label="New Password"
      type="password"
    />

    <InputField
      id="password-confirmation"
      v-model="state.passwordConfirmation"
      :error-messages="v$.passwordConfirmation.$errors"
      hint="Enter the same password as before, for verification."
      label="Password Confirmation"
      type="password"
    />

    <div :class="css.row">
      <ActionButton
        :class="css.confirm"
        :disabled="v$.$invalid"
        :loading="loading"
        primary
        small
        text="Change Password"
        @click="changePassword"
      >
        <SpinnerIcon v-if="loading" class="animate-spin" />
      </ActionButton>
      <span v-if="success" :class="css.success">
        <CheckMarkIcon /> Your password has been changed.
      </span>
    </div>
  </CardContainer>
</template>
<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { minLength, required, sameAs } from '@vuelidate/validators'
import { storeToRefs } from 'pinia'
import { useMainStore } from '~/store'
import { ActionResult } from '~/types/common'

const loading = ref(false)
const success = ref(false)

const store = useMainStore()
const { account } = storeToRefs(store)

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

const css = useCssModule()
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
