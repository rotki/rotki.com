<template>
  <div>
    <card>
      <heading subheading>Account Details</heading>
      <input-field
        id="email"
        v-model="state.email"
        disabled
        hint="At the moment user email can't be changed. Email us support@rotki.com if you need to do so."
        label="Email"
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
    <card :class="$style.info">
      <heading subheading> Customer Information </heading>
      <input-field
        id="github"
        v-model="state.githubUsername"
        hint="Optional. Provide Github username for in-Github support."
        label="Github Username"
      />

      <input-field
        id="first-name"
        v-model="state.firstName"
        hint="Required. Will only be used for invoice of payments."
        label="First Name"
      />
      <input-field
        id="last-name"
        v-model="state.lastName"
        hint="Required. Will only be used for invoice of payments."
        label="Last Name"
      />
      <input-field
        id="company-name"
        v-model="state.companyName"
        hint="Optional. If you want to be invoiced as a company the given company name will be added to the invoice."
        label="Company Name"
      />
      <input-field
        id="vat-id"
        v-model="state.vatId"
        hint="Optional. If you want to be invoiced as a company, the provided VAT ID will be added to the invoice."
        label="VAT ID"
      />

      <heading subheading>Address</heading>

      <input-field
        id="address-1"
        v-model="state.addressLine1"
        hint="Required. Will only be used for invoice of payments."
        label="Address line 1"
      />
      <input-field
        id="address-2"
        v-model="state.addressLine2"
        hint="Optional. Additional data for the address."
        label="Address line 2"
      />
      <input-field
        id="city"
        v-model="state.city"
        hint="Required. Will only be used for invoice of payments."
        label="City"
      />
      <input-field
        id="postal"
        v-model="state.postcode"
        hint="Required. Will only be used for invoice of payments."
        label="Postal code"
      />
      <input-field
        id="country"
        v-model="state.country"
        :items="countries"
        hint="Required. Will only be used for invoice of payments."
        label="Country"
        placeholder="Select country"
        type="select"
      />
      <action-button primary small text="Update" />
    </card>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import {
  computed,
  onMounted,
  reactive,
  ref,
  useStore,
} from '@nuxtjs/composition-api'
import { useVuelidate } from '@vuelidate/core'
import { RootState } from '~/store'
import { loadCountries } from '~/composables/countries'

export default defineComponent({
  name: 'AccountDetails',
  setup() {
    const store = useStore<RootState>()
    const state = reactive({
      email: '',
      currentPassword: '',
      newPassword: '',
      passwordConfirm: '',
      githubUsername: '',
      firstName: '',
      lastName: '',
      companyName: '',
      vatId: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcode: '',
      country: '',
    })

    const movedOffline = computed(
      () => store.state.account?.address.moved_offline ?? false
    )

    onMounted(() => {
      const account = store.state.account
      if (!account) {
        return
      }

      state.email = account.email
      state.githubUsername = account.github_username
      state.firstName = account.address.first_name
      state.lastName = account.address.last_name
      state.companyName = account.address.company_name
      state.vatId = account.address.vat_id
      state.addressLine1 = account.address.address_1
      state.addressLine2 = account.address.address_2
      state.city = account.address.city
      state.postcode = account.address.postcode
      state.country = account.address.country
    })

    const rules = {}
    const $externalResults = ref({})
    const v$ = useVuelidate(rules, state, {
      $autoDirty: true,
      $externalResults,
    })
    return {
      movedOffline,
      state,
      v$,
      ...loadCountries(),
    }
  },
})
</script>

<style lang="scss" module>
.info {
  @apply mt-8;
}
</style>
