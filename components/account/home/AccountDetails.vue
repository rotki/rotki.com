<template>
  <div>
    <change-password :state="state" />
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
import ChangePassword from '~/components/account/home/ChangePassword.vue'

export default defineComponent({
  name: 'AccountDetails',
  components: { ChangePassword },
  setup() {
    const store = useStore<RootState>()
    const state = reactive({
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
      () => store.state.account?.address.movedOffline ?? false
    )

    onMounted(() => {
      const account = store.state.account
      if (!account) {
        return
      }

      state.githubUsername = account.githubUsername
      state.firstName = account.address.firstName
      state.lastName = account.address.lastName
      state.companyName = account.address.companyName
      state.vatId = account.address.vatId
      state.addressLine1 = account.address.address1
      state.addressLine2 = account.address.address2
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
