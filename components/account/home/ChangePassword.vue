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
      hint="Enter your current account password. Only needed if you want to change password"
      label="Current Password"
      type="password"
    />

    <input-field
      id="current-password"
      v-model="state.newPassword"
      hint="Enter a new password for your account"
      label="New Password"
      type="password"
    />

    <input-field
      id="password-confirmation"
      v-model="state.passwordConfirm"
      hint="Enter the same password as before, for verification."
      label="Password Confirmation"
      type="password"
    />
    <action-button primary small text="Change Password" />
  </card>
</template>
<script lang="ts">
import {
  computed,
  defineComponent,
  reactive,
  useStore,
} from '@nuxtjs/composition-api'
import { RootState } from '~/store'

export default defineComponent({
  name: 'ChangePassword',
  setup() {
    const store = useStore<RootState>()
    const email = computed(() => {
      const account = store.state.account
      return !account ? '' : account.email
    })
    const state = reactive({
      currentPassword: '',
      newPassword: '',
      passwordConfirm: '',
    })
    return {
      email,
      state,
    }
  },
})
</script>
